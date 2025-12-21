const { ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { getStorageClient, getAvailableProviders } = require('./storage-config')

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '3600'
      },
      body: ''
    }
  }

  // Allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Get provider from query params (optional)
    const queryParams = event.queryStringParameters || {}
    const preferredProvider = queryParams.provider // 'r2', 'do', or undefined

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

    // List objects in the videos folder
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'videos/'
    })

    const response = await s3Client.send(command)

    // Format the video list
    const videos = (response.Contents || [])
      .filter(item => item.Size > 0) // Filter out folders
      .map(item => {
        // Extract filename from key
        const filename = item.Key.split('/').pop()
        // Try to extract original filename from timestamp prefix
        const nameMatch = filename.match(/^\d+-(.+)$/)
        const displayName = nameMatch ? nameMatch[1].replace(/_/g, ' ') : filename

        return {
          key: item.Key,
          name: displayName,
          size: item.Size,
          uploaded: item.LastModified,
          contentType: getContentType(filename),
          provider: provider
        }
      })
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded)) // Sort by newest first

    // Get available providers for frontend
    const availableProviders = getAvailableProviders()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        videos,
        count: videos.length,
        provider,
        availableProviders
      })
    }
  } catch (error) {
    console.error('Error listing videos:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Failed to list videos',
        details: error.message
      })
    }
  }
}

// Helper function to determine content type from filename
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const types = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska'
  }
  return types[ext] || 'video/mp4'
}
