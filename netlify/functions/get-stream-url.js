const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { key } = JSON.parse(event.body)

    if (!key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Video key is required' })
      }
    }

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

    // Create presigned URL for streaming
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    })

    const streamUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // URL valid for 1 hour
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        streamUrl,
        message: 'Stream URL generated successfully'
      })
    }
  } catch (error) {
    console.error('Error generating stream URL:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate stream URL',
        details: error.message 
      })
    }
  }
}

