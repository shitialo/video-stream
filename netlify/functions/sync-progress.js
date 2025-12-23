const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getStorageClient } = require('./storage-config')

/**
 * Sync Progress API
 * 
 * GET: Retrieve progress for a sync code
 * POST: Save progress for a sync code
 * 
 * Progress is stored in a dedicated folder: sync-data/{code}.json
 */

const SYNC_FOLDER = 'sync-data'

// Generate a random 6-character alphanumeric code
function generateSyncCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusable chars (0/O, 1/I/L)
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// Get progress data for a sync code
async function getProgress(s3Client, bucketName, code) {
    try {
        const key = `${SYNC_FOLDER}/${code.toUpperCase()}.json`
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        })
        const response = await s3Client.send(command)
        const body = await response.Body.transformToString()
        return JSON.parse(body)
    } catch (err) {
        if (err.name === 'NoSuchKey' || err.Code === 'NoSuchKey') {
            return null // Code doesn't exist yet
        }
        throw err
    }
}

// Save progress data for a sync code
async function saveProgress(s3Client, bucketName, code, data) {
    const key = `${SYNC_FOLDER}/${code.toUpperCase()}.json`
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json'
    })
    await s3Client.send(command)
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers }
    }

    try {
        // Use DO Spaces for sync data (or R2 if that's what's configured)
        const { s3Client, bucketName, provider } = getStorageClient()

        if (!s3Client) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Storage not configured' })
            }
        }

        // GET: Retrieve progress
        if (event.httpMethod === 'GET') {
            const code = event.queryStringParameters?.code

            if (!code) {
                // Generate a new code
                const newCode = generateSyncCode()
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        code: newCode,
                        progress: {},
                        isNew: true
                    })
                }
            }

            // Fetch existing progress
            const progress = await getProgress(s3Client, bucketName, code)

            if (progress === null) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Sync code not found' })
                }
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    code: code.toUpperCase(),
                    progress: progress.watchProgress || {},
                    lastUpdated: progress.lastUpdated
                })
            }
        }

        // POST: Save progress
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}')
            const { code, progress } = body

            if (!code) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Sync code is required' })
                }
            }

            if (!progress || typeof progress !== 'object') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Progress data is required' })
                }
            }

            // Get existing data to merge
            let existingData = await getProgress(s3Client, bucketName, code)

            // Merge progress (newer entries take precedence)
            const mergedProgress = {
                ...(existingData?.watchProgress || {}),
                ...progress
            }

            // For each video, keep the one with the latest updatedAt
            for (const key of Object.keys(mergedProgress)) {
                const existing = existingData?.watchProgress?.[key]
                const incoming = progress[key]

                if (existing && incoming) {
                    // Keep the more recent one
                    if (existing.updatedAt > incoming.updatedAt) {
                        mergedProgress[key] = existing
                    }
                }
            }

            // Save merged data
            await saveProgress(s3Client, bucketName, code, {
                watchProgress: mergedProgress,
                lastUpdated: Date.now()
            })

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    code: code.toUpperCase(),
                    lastUpdated: Date.now()
                })
            }
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        }

    } catch (err) {
        console.error('Sync progress error:', err)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: err.message })
        }
    }
}
