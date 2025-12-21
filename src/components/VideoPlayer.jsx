import { useEffect, useRef, useState } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import axios from 'axios'

function VideoPlayer({ video, onClose, provider }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [streamUrl, setStreamUrl] = useState(null)
  const [subtitleUrls, setSubtitleUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch streaming URL and subtitle URLs
    const fetchUrls = async () => {
      try {
        setLoading(true)

        // Get video stream URL
        const videoResponse = await axios.post('/.netlify/functions/get-stream-url', {
          key: video.key,
          provider: provider
        })
        setStreamUrl(videoResponse.data.streamUrl)

        // Get subtitle URLs if available
        if (video.subtitles && video.subtitles.length > 0) {
          const subtitlePromises = video.subtitles.map(async (sub) => {
            try {
              const subResponse = await axios.post('/.netlify/functions/get-stream-url', {
                key: sub.key,
                provider: provider
              })
              return {
                src: subResponse.data.streamUrl,
                srclang: sub.language?.substring(0, 2).toLowerCase() || 'en',
                label: sub.language || 'English',
                kind: 'subtitles'
              }
            } catch (err) {
              console.error('Error getting subtitle URL:', err)
              return null
            }
          })
          const subs = (await Promise.all(subtitlePromises)).filter(Boolean)
          setSubtitleUrls(subs)
        }

        setError(null)
      } catch (err) {
        console.error('Error getting stream URL:', err)
        setError('Failed to load video')
      } finally {
        setLoading(false)
      }
    }

    fetchUrls()
  }, [video.key, video.subtitles, provider])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      aspectRatio: '16:9',
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'remainingTimeDisplay',
          'playbackRateMenuButton',
          'subtitlesButton',
          'pictureInPictureToggle',
          'fullscreenToggle'
        ]
      }
    })

    playerRef.current = player

    // Set the source
    player.src({
      src: streamUrl,
      type: video.contentType || 'video/mp4'
    })

    // Add subtitles if available
    subtitleUrls.forEach((sub, index) => {
      player.addRemoteTextTrack({
        kind: sub.kind,
        srclang: sub.srclang,
        label: sub.label,
        src: sub.src,
        default: index === 0 // Make first subtitle default
      }, false)
    })

    // Add keyboard shortcuts
    player.on('keydown', (e) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          if (player.paused()) {
            player.play()
          } else {
            player.pause()
          }
          break
        case 'f':
          e.preventDefault()
          if (player.isFullscreen()) {
            player.exitFullscreen()
          } else {
            player.requestFullscreen()
          }
          break
        case 'm':
          e.preventDefault()
          player.muted(!player.muted())
          break
        case 'ArrowLeft':
          e.preventDefault()
          player.currentTime(Math.max(0, player.currentTime() - 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          player.currentTime(Math.min(player.duration(), player.currentTime() + 5))
          break
        case 'ArrowUp':
          e.preventDefault()
          player.volume(Math.min(1, player.volume() + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          player.volume(Math.max(0, player.volume() - 0.1))
          break
        case 'c':
          e.preventDefault()
          // Toggle subtitles
          const tracks = player.textTracks()
          for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].kind === 'subtitles') {
              tracks[i].mode = tracks[i].mode === 'showing' ? 'disabled' : 'showing'
              break
            }
          }
          break
        default:
          break
      }
    })

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [streamUrl, subtitleUrls, video.contentType])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const getProviderBadge = () => {
    if (provider === 'do') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
          DO Spaces
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-medium rounded-full">
        R2
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-4 px-4 bg-black bg-opacity-90 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Library</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close player"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Info */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-xl md:text-2xl font-bold text-white break-all">{video.name}</h2>
            {getProviderBadge()}
            {video.subtitles && video.subtitles.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {video.subtitles.length} Subtitle{video.subtitles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {(video.size / (1024 * 1024)).toFixed(2)} MB
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(video.uploaded).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          {loading && (
            <div className="flex items-center justify-center aspect-video bg-gray-900">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-medium">Loading video...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center aspect-video bg-gray-900">
              <div className="text-center text-red-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && streamUrl && (
            <div data-vjs-player>
              <video
                ref={videoRef}
                className="video-js vjs-big-play-centered"
              />
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg">
          <p className="text-sm text-gray-300 font-semibold mb-2">Keyboard Shortcuts:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">Space</kbd> / <kbd className="px-2 py-1 bg-gray-700 rounded">K</kbd> Play/Pause</div>
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">F</kbd> Fullscreen</div>
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">M</kbd> Mute</div>
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">C</kbd> Toggle Subtitles</div>
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">←</kbd> / <kbd className="px-2 py-1 bg-gray-700 rounded">→</kbd> Seek ±5s</div>
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">↑</kbd> / <kbd className="px-2 py-1 bg-gray-700 rounded">↓</kbd> Volume</div>
            <div><kbd className="px-2 py-1 bg-gray-700 rounded">Esc</kbd> Close</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
