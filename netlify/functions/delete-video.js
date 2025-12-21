const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getStorageClient } = require('./storage-config')

exports.handler = async (event) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
                'Access-Control-Max-Age': '3600'
            },
            body: ''
        }
    }

    // Only allow POST or DELETE requests
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Method not allowed' })
        }
    }

    try {
        const { key, provider: preferredProvider } = JSON.parse(event.body)

        if (!key) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Video key is required' })
            }
        }

        // Get storage client based on provider
        const { s3Client, bucketName, provider } = getStorageClient(preferredProvider)

        if (!s3Client) {
            console.error('No storage provider configured')
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No storage provider configured' })
            }
        }

        // Delete the object
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key
        })

        await s3Client.send(command)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                key,
                provider,
                message: 'Video deleted successfully'
            })
        }
    } catch (error) {
        console.error('Error deleting video:', error)
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: 'Failed to delete video',
                details: error.message
            })
        }
    }
}
