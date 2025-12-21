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
      headers: { 'Access-Control-Allow-Origin': '*' },
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

    // List ALL objects in the videos folder (including subdirectories)
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'videos/'
    })

    const response = await s3Client.send(command)
    const allItems = response.Contents || []

    // Separate files by type
    const videoFiles = []
    const subtitleFiles = []
    const posterFiles = []

    allItems.forEach(item => {
      if (item.Size === 0) return // Skip folders

      const fullPath = item.Key
      const filename = fullPath.split('/').pop()
      const ext = filename.split('.').pop().toLowerCase()

      if (VIDEO_EXTENSIONS.includes(ext)) {
        videoFiles.push({ ...item, filename, fullPath })
      } else if (SUBTITLE_EXTENSIONS.includes(ext)) {
        // Subtitles are in: videos/Subs/<EpisodeName>/2_eng,English.srt
        // Extract the episode folder name from path
        const pathParts = fullPath.split('/')
        // Find the Subs folder and get the episode name after it
        const subsIndex = pathParts.findIndex(p => p.toLowerCase() === 'subs')
        const episodeFolderName = subsIndex >= 0 ? pathParts[subsIndex + 1] : null

        subtitleFiles.push({
          ...item,
          filename,
          fullPath,
          episodeFolderName // e.g. "Boston.Legal.S01E01.1080p.WEBRip.x265-KONTRAST"
        })
      } else if (IMAGE_EXTENSIONS.includes(ext)) {
        // Posters: videos/Boston.Legal.S01E01.1080p.WEBRip.x265-KONTRAST-poster.jpg
        posterFiles.push({ ...item, filename, fullPath })
      }
    })

    // Build video list with matched subtitles and posters
    const videos = videoFiles.map(item => {
      const filename = item.filename
      // Try to extract original filename from timestamp prefix
      const nameMatch = filename.match(/^\d+-(.+)$/)
      const cleanFilename = nameMatch ? nameMatch[1] : filename
      const videoBaseName = cleanFilename.replace(/\.[^.]+$/, '') // Remove extension
      const displayName = videoBaseName.replace(/_/g, ' ')

      // Find matching subtitles (in Subs/<episode-folder-name>/ directory)
      const matchedSubtitles = subtitleFiles
        .filter(sub => {
          // Match if the subtitle's episode folder name matches the video base name
          if (sub.episodeFolderName) {
            return sub.episodeFolderName === videoBaseName
          }
          return false
        })
        .map(sub => ({
          key: sub.Key,
          filename: sub.filename,
          language: extractLanguage(sub.filename)
        }))

      // Find matching poster (video-name-poster.jpg)
      const poster = posterFiles.find(p => {
        const posterBaseName = p.filename.replace(/-poster\.[^.]+$/, '')
        return posterBaseName === videoBaseName
      })

      return {
        key: item.Key,
        name: displayName,
        size: item.Size,
        uploaded: item.LastModified,
        contentType: getContentType(filename),
        provider: provider,
        subtitles: matchedSubtitles,
        poster: poster ? poster.Key : null
      }
    })

    // Sort by episode number
    videos.sort((a, b) => {
      const aMatch = a.name.match(/[Ss](\d+)[Ee](\d+)/)
      const bMatch = b.name.match(/[Ss](\d+)[Ee](\d+)/)

      if (aMatch && bMatch) {
        const aSeason = parseInt(aMatch[1])
        const bSeason = parseInt(bMatch[1])
        if (aSeason !== bSeason) return aSeason - bSeason
        return parseInt(aMatch[2]) - parseInt(bMatch[2])
      }

      return a.name.localeCompare(b.name)
    })

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
        availableProviders,
        debug: {
          totalSubtitles: subtitleFiles.length,
          totalPosters: posterFiles.length
        }
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

// Extract language from subtitle filename like "2_eng,English.srt"
function extractLanguage(filename) {
  // Patterns: "2_eng,English.srt", "3_fre,French.srt"
  const patterns = [
    /,([A-Z][a-z]+)\./i,           // ",English." 
    /[_]([a-z]{2,3}),/i,           // "_eng,"
    /[_-]([A-Za-z]+)\.[^.]+$/i     // "_english.srt"
  ]

  for (const pattern of patterns) {
    const match = filename.match(pattern)
    if (match) {
      const lang = match[1]
      return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
    }
  }
  return 'English'
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
