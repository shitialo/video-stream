import { useState, useEffect } from 'react'
import axios from 'axios'
import { getProgressPercent, isWatched, groupVideosBySeries, parseEpisodeInfo } from '../utils/watchProgress'

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

  return <img src={posterUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
}

// Video Card Component
function VideoCard({ video, provider, onVideoSelect, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const progress = getProgressPercent(video.key)
  const watched = isWatched(video.key)
  const episodeInfo = parseEpisodeInfo(video.name)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setDeleting(true)
    try {
      await axios.post('/.netlify/functions/delete-video', {
        key: video.key,
        provider: provider
      })
      onDelete()
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 group"
      onClick={() => onVideoSelect(video)}
    >
      {/* Thumbnail */}
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

        {/* Watched Badge */}
        {watched && (
          <div className="absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Subtitle Badge */}
        {video.subtitles && video.subtitles.length > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
            CC
          </div>
        )}

        {/* Episode Number Badge */}
        {episodeInfo && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
            E{episodeInfo.episode}
          </div>
        )}

        {/* Hover Play Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
            <div
              className={`h-full ${watched ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate" title={video.name}>
          {episodeInfo ? `Episode ${episodeInfo.episode}` : video.name}
        </h3>
        {episodeInfo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
            {video.name}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(video.size)}</span>
          {progress > 0 && !watched && (
            <span className="text-primary-500">{progress}% watched</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            className={`flex-1 py-2 text-white font-medium rounded-lg transition-colors text-sm ${provider === 'do' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            onClick={(e) => { e.stopPropagation(); onVideoSelect(video) }}
          >
            {progress > 0 && !watched ? 'Continue' : 'Play'}
          </button>

          {showDeleteConfirm ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '...' : '✓'}
              </button>
              <button
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
              onClick={handleDelete}
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Season Section Component
function SeasonSection({ seasonNum, episodes, provider, onVideoSelect, onRefresh, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left mb-3 group"
      >
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-500">
          Season {seasonNum}
        </h3>
        <span className="text-sm text-gray-500">({episodes.length} episodes)</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {episodes.map((video) => (
            <VideoCard
              key={video.key}
              video={video}
              provider={provider}
              onVideoSelect={onVideoSelect}
              onDelete={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Series Section Component
function SeriesSection({ seriesName, seasons, provider, onVideoSelect, onRefresh }) {
  const [expanded, setExpanded] = useState(true)
  const totalEpisodes = Object.values(seasons).flat().length

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left mb-4 group"
      >
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-500">
          {seriesName}
        </h2>
        <span className="text-sm text-gray-500">
          {Object.keys(seasons).length} season{Object.keys(seasons).length > 1 ? 's' : ''} • {totalEpisodes} episodes
        </span>
      </button>

      {expanded && (
        <div>
          {Object.entries(seasons)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([seasonNum, episodes]) => (
              <SeasonSection
                key={seasonNum}
                seasonNum={seasonNum}
                episodes={episodes}
                provider={provider}
                onVideoSelect={onVideoSelect}
                onRefresh={onRefresh}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function VideoLibrary({ videos, loading, onVideoSelect, onRefresh, provider }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grouped') // 'grouped' or 'grid'

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const { grouped, ungrouped } = groupVideosBySeries(filteredVideos)

  const getProviderBadge = () => {
    if (provider === 'do') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
          DO Spaces
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
        R2
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Video Library</h2>
              {getProviderBadge()}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredVideos.length} videos • {Object.keys(grouped).length} series
            </p>
          </div>

          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grouped' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                Series
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                All
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading videos...</p>
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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No videos yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {provider === 'do' ? 'Upload videos to DO Spaces' : 'Upload your first video'}
          </p>
        </div>
      )}

      {/* Grouped View */}
      {!loading && viewMode === 'grouped' && (
        <>
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([seriesName, seasons]) => (
              <SeriesSection
                key={seriesName}
                seriesName={seriesName}
                seasons={seasons}
                provider={provider}
                onVideoSelect={onVideoSelect}
                onRefresh={onRefresh}
              />
            ))}

          {/* Ungrouped Videos */}
          {ungrouped.length > 0 && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Other Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ungrouped.map((video) => (
                  <VideoCard
                    key={video.key}
                    video={video}
                    provider={provider}
                    onVideoSelect={onVideoSelect}
                    onDelete={onRefresh}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Grid View (All Videos) */}
      {!loading && viewMode === 'grid' && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.key}
              video={video}
              provider={provider}
              onVideoSelect={onVideoSelect}
              onDelete={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default VideoLibrary
