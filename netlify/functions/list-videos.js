const { ListObjectsV2Command } = require('@aws-sdk/client-s3')
const { getStorageClient, getAvailableProviders } = require('./storage-config')

// Supported video formats
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v']
// Supported subtitle formats
const SUBTITLE_EXTENSIONS = ['srt', 'vtt', 'ass', 'ssa']
// Supported poster/thumbnail formats
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

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
    const allItems = response.Contents || []

    // Build a map of base names to associated files (subtitles, posters)
    const fileMap = new Map()

    allItems.forEach(item => {
      const filename = item.Key.split('/').pop()
      const ext = filename.split('.').pop().toLowerCase()

      // Get base name (without extension and common suffixes)
      let baseName = filename.replace(/\.[^.]+$/, '') // Remove extension
      baseName = baseName.replace(/-poster$/, '') // Remove -poster suffix

      if (!fileMap.has(baseName)) {
        fileMap.set(baseName, { video: null, subtitles: [], poster: null })
      }

      const entry = fileMap.get(baseName)

      if (VIDEO_EXTENSIONS.includes(ext)) {
        entry.video = item
      } else if (SUBTITLE_EXTENSIONS.includes(ext)) {
        entry.subtitles.push({
          key: item.Key,
          filename: filename,
          language: extractLanguage(filename)
        })
      } else if (IMAGE_EXTENSIONS.includes(ext) && filename.includes('-poster')) {
        entry.poster = item.Key
      }
    })

    // Format the video list (only actual videos)
    const videos = []

    fileMap.forEach((files, baseName) => {
      if (!files.video) return // Skip if no video file

      const item = files.video
      const filename = item.Key.split('/').pop()
      // Try to extract original filename from timestamp prefix
      const nameMatch = filename.match(/^\d+-(.+)$/)
      const displayName = nameMatch
        ? nameMatch[1].replace(/_/g, ' ').replace(/\.[^.]+$/, '')
        : filename.replace(/\.[^.]+$/, '')

      videos.push({
        key: item.Key,
        name: displayName,
        size: item.Size,
        uploaded: item.LastModified,
        contentType: getContentType(filename),
        provider: provider,
        subtitles: files.subtitles,
        poster: files.poster
      })
    })

    // Sort by newest first
    videos.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))

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

// Extract language code from subtitle filename
function extractLanguage(filename) {
  // Common patterns: 2_eng,English.srt, video.en.srt, video_english.srt
  const patterns = [
    /[_.]([a-z]{2,3})[,_.]?([A-Za-z]+)?\.srt$/i,
    /[_-]([A-Za-z]+)\.srt$/i
  ]

  for (const pattern of patterns) {
    const match = filename.match(pattern)
    if (match) {
      return match[2] || match[1] // Prefer full name if available
    }
  }
  return 'Unknown'
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
    'mkv': 'video/x-matroska',
    'm4v': 'video/x-m4v'
  }
  return types[ext] || 'video/mp4'
}
