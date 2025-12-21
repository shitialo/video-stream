const { S3Client } = require('@aws-sdk/client-s3')

/**
 * Get storage client configuration based on provider preference and environment variables.
 * @param {string} preferredProvider - 'r2', 'do', or undefined (auto-detect)
 * @returns {{ s3Client: S3Client, bucketName: string, provider: string }}
 */
function getStorageClient(preferredProvider) {
  const hasR2 = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
  const hasDO = process.env.DO_SPACES_ACCESS_KEY_ID && process.env.DO_SPACES_SECRET_ACCESS_KEY

  // Determine which provider to use
  let provider = preferredProvider
  if (!provider) {
    // Auto-detect: prefer DO if configured, otherwise R2
    provider = hasDO ? 'do' : (hasR2 ? 'r2' : null)
  }

  if (provider === 'do' && hasDO) {
    const region = process.env.DO_SPACES_REGION || 'sfo3'
    return {
      s3Client: new S3Client({
        region: region,
        endpoint: `https://${region}.digitaloceanspaces.com`,
        credentials: {
          accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
          secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY
        }
      }),
      bucketName: process.env.DO_SPACES_BUCKET_NAME || 'my-movies',
      provider: 'do'
    }
  }

  if (provider === 'r2' && hasR2) {
    return {
      s3Client: new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        }
      }),
      bucketName: process.env.R2_BUCKET_NAME,
      provider: 'r2'
    }
  }

  return { s3Client: null, bucketName: null, provider: null }
}

/**
 * Get available providers based on environment configuration
 * @returns {{ r2: boolean, do: boolean }}
 */
function getAvailableProviders() {
  return {
    r2: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    do: !!(process.env.DO_SPACES_ACCESS_KEY_ID && process.env.DO_SPACES_SECRET_ACCESS_KEY)
  }
}

module.exports = { getStorageClient, getAvailableProviders }
