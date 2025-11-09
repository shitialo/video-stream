const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3')

exports.handler = async (event) => {
  // Allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Validate environment variables
    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME
    } = process.env

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.error('Missing R2 configuration')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    }

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    })

    // List objects in the videos folder
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
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
          contentType: getContentType(filename)
        }
      })
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded)) // Sort by newest first

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        videos,
        count: videos.length
      })
    }
  } catch (error) {
    console.error('Error listing videos:', error)
    return {
      statusCode: 500,
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
    'avi': 'video/x-msvideo'
  }
  return types[ext] || 'video/mp4'
}

