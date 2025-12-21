import { useState, useEffect } from 'react'
import axios from 'axios'

// Component to load and display poster with presigned URL
function PosterImage({ posterKey, provider, fallbackGradient }) {
  const [posterUrl, setPosterUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!posterKey) {
      setLoading(false)
      return
    }

    const fetchPosterUrl = async () => {
      try {
        const response = await axios.post('/.netlify/functions/get-stream-url', {
          key: posterKey,
          provider: provider
        })
        setPosterUrl(response.data.streamUrl)
      } catch (err) {
        console.error('Error fetching poster:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosterUrl()
  }, [posterKey, provider])

  if (!posterKey || loading || !posterUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${fallbackGradient}`}>
        <svg className="w-16 h-16 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={posterUrl}
      alt="Video thumbnail"
      className="w-full h-full object-cover"
    />
  )
}

function VideoLibrary({ videos, loading, onVideoSelect, onRefresh, provider }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingKey, setDeletingKey] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (video, e) => {
    e.stopPropagation() // Prevent card click
    setShowDeleteConfirm(video.key)
  }

  const confirmDelete = async (video, e) => {
    e.stopPropagation()
    try {
      setDeletingKey(video.key)
      await axios.post('/.netlify/functions/delete-video', {
        key: video.key,
        provider: provider
      })
      setShowDeleteConfirm(null)
      onRefresh() // Refresh the list
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video: ' + (error.response?.data?.error || error.message))
    } finally {
      setDeletingKey(null)
    }
  }

  const cancelDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(null)
  }

  const getProviderBadge = () => {
    if (provider === 'do') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 5.46 4.45 9.91 9.91 9.91 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91z" />
          </svg>
          DO Spaces
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        R2
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Video Library
              </h2>
              {getProviderBadge()}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} available
            </p>
          </div>

          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Refresh library"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading videos...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No videos yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {provider === 'do'
              ? 'Upload videos to your DO Spaces bucket via rclone or the dashboard'
              : 'Upload your first video to get started'
            }
          </p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && videos.length > 0 && filteredVideos.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No videos match your search query
          </p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.key}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1"
              onClick={() => onVideoSelect(video)}
            >
              {/* Thumbnail with Poster */}
              <div className={`relative aspect-video ${provider === 'do'
                ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                : 'bg-gradient-to-br from-primary-500 to-primary-700'
                }`}>
                <PosterImage
                  posterKey={video.poster}
                  provider={provider}
                  fallbackGradient={provider === 'do'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-primary-500 to-primary-700'
                  }
                />

                {/* Hover overlay with play button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Subtitle badge */}
                {video.subtitles && video.subtitles.length > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    CC
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate" title={video.name}>
                  {video.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {formatFileSize(video.size)}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(video.uploaded)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    className={`flex-1 py-2 text-white font-semibold rounded-lg transition-colors ${provider === 'do'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    onClick={(e) => { e.stopPropagation(); onVideoSelect(video) }}
                  >
                    Play
                  </button>

                  {/* Delete Button */}
                  {showDeleteConfirm === video.key ? (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                        onClick={(e) => confirmDelete(video, e)}
                        disabled={deletingKey === video.key}
                      >
                        {deletingKey === video.key ? '...' : 'Yes'}
                      </button>
                      <button
                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm"
                        onClick={cancelDelete}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400 rounded-lg transition-colors"
                      onClick={(e) => handleDelete(video, e)}
                      title="Delete video"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VideoLibrary
