const { GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { getStorageClient } = require('./storage-config')

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '3600'
      },
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
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

    // Create presigned URL for streaming
    const command = new GetObjectCommand({
      Bucket: bucketName,
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
        provider,
        message: 'Stream URL generated successfully'
      })
    }
  } catch (error) {
    console.error('Error generating stream URL:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Failed to generate stream URL',
        details: error.message
      })
    }
  }
}
