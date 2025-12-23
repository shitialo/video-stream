import { useEffect, useRef, useState, useCallback } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import axios from 'axios'
import { saveProgress, getProgress, formatTime, findNextEpisode } from '../utils/watchProgress'

function VideoPlayer({ video, onClose, provider, allVideos = [], onVideoSelect }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const playerContainerRef = useRef(null)
  const progressSaveInterval = useRef(null)

  const [streamUrl, setStreamUrl] = useState(null)
  const [subtitleUrls, setSubtitleUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [seekIndicator, setSeekIndicator] = useState(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedTime, setSavedTime] = useState(0)
  const [showNextEpisode, setShowNextEpisode] = useState(false)
  const [nextEpisode, setNextEpisode] = useState(null)
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10)
  const [downloading, setDownloading] = useState(false)

  const lastTapTimeRef = useRef(0)
  const lastTapSideRef = useRef(null)
  const nextEpisodeRef = useRef(null)

  // Find next episode on mount
  useEffect(() => {
    if (allVideos.length > 0) {
      const next = findNextEpisode(video, allVideos)
      setNextEpisode(next)
      nextEpisodeRef.current = next
    }
  }, [video, allVideos])

  // Fetch streaming URL and subtitle URLs
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setLoading(true)

        const videoResponse = await axios.post('/.netlify/functions/get-stream-url', {
          key: video.key,
          provider: provider
        })
        setStreamUrl(videoResponse.data.streamUrl)

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
                kind: 'subtitles',
                key: sub.key
              }
            } catch (err) {
              console.error('Error getting subtitle URL:', err)
              return null
            }
          })
          const subs = (await Promise.all(subtitlePromises)).filter(Boolean)
          setSubtitleUrls(subs)
        }

        // Check for saved progress
        const progress = getProgress(video.key)
        if (progress && progress.percent > 5 && progress.percent < 95) {
          setSavedTime(progress.currentTime)
          setShowResumePrompt(true)
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

  // Initialize player
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

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

    player.src({
      src: streamUrl,
      type: video.contentType || 'video/mp4'
    })

    // Add subtitles
    subtitleUrls.forEach((sub, index) => {
      player.addRemoteTextTrack({
        kind: sub.kind,
        srclang: sub.srclang,
        label: sub.label,
        src: sub.src,
        default: index === 0
      }, false)
    })

    // Save progress periodically
    progressSaveInterval.current = setInterval(() => {
      if (player && !player.paused() && player.duration()) {
        saveProgress(video.key, player.currentTime(), player.duration())
      }
    }, 5000)

    // Save on pause
    player.on('pause', () => {
      if (player.duration()) {
        saveProgress(video.key, player.currentTime(), player.duration())
      }
    })

    // Check for end of video (show next episode)
    player.on('timeupdate', () => {
      const remaining = player.duration() - player.currentTime()
      if (remaining <= 30 && remaining > 0 && nextEpisode && !showNextEpisode) {
        setShowNextEpisode(true)
        setNextEpisodeCountdown(Math.ceil(remaining))
      }
      if (remaining > 30) {
        setShowNextEpisode(false)
      }
    })

    // Auto-play next countdown
    player.on('ended', () => {
      saveProgress(video.key, player.duration(), player.duration())
      if (nextEpisodeRef.current && onVideoSelect) {
        // Auto-play next after 3 seconds
        setTimeout(() => {
          if (nextEpisodeRef.current) {
            onVideoSelect(nextEpisodeRef.current)
          }
        }, 3000)
      }
    })

    // Keyboard shortcuts
    player.on('keydown', (e) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          player.paused() ? player.play() : player.pause()
          break
        case 'f':
          e.preventDefault()
          player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen()
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
          const tracks = player.textTracks()
          for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].kind === 'subtitles') {
              tracks[i].mode = tracks[i].mode === 'showing' ? 'disabled' : 'showing'
              break
            }
          }
          break
        case 'p':
          e.preventDefault()
          togglePictureInPicture()
          break
        default:
          break
      }
    })

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current)
      }
      if (playerRef.current) {
        // Save progress before closing
        if (player.duration()) {
          saveProgress(video.key, player.currentTime(), player.duration())
        }
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [streamUrl, subtitleUrls, video.contentType, video.key, onVideoSelect, showNextEpisode])

  // Update countdown
  useEffect(() => {
    if (showNextEpisode && nextEpisodeCountdown > 0) {
      const timer = setInterval(() => {
        setNextEpisodeCountdown(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showNextEpisode, nextEpisodeCountdown])

  // ESC to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleResume = () => {
    if (playerRef.current && savedTime) {
      playerRef.current.currentTime(savedTime)
    }
    setShowResumePrompt(false)
  }

  const handleStartOver = () => {
    if (playerRef.current) {
      playerRef.current.currentTime(0)
    }
    setShowResumePrompt(false)
  }

  const togglePictureInPicture = async () => {
    try {
      const videoEl = videoRef.current
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (videoEl && document.pictureInPictureEnabled) {
        await videoEl.requestPictureInPicture()
      }
    } catch (err) {
      console.error('PiP error:', err)
    }
  }

  const handleDownload = async () => {
    if (!streamUrl || downloading) return

    setDownloading(true)
    try {
      // Download video
      const link = document.createElement('a')
      link.href = streamUrl
      link.download = video.name + '.mp4'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handleDoubleTap = (e) => {
    const now = Date.now()
    const rect = playerContainerRef.current?.getBoundingClientRect()
    if (!rect) return

    const touch = e.changedTouches[0]
    const x = touch.clientX - rect.left
    const isRightSide = x > rect.width / 2
    const side = isRightSide ? 'right' : 'left'

    if (now - lastTapTimeRef.current < 300 && lastTapSideRef.current === side) {
      const player = playerRef.current
      if (player) {
        if (isRightSide) {
          player.currentTime(Math.min(player.duration(), player.currentTime() + 30))
          setSeekIndicator('forward')
        } else {
          player.currentTime(Math.max(0, player.currentTime() - 30))
          setSeekIndicator('backward')
        }
        setTimeout(() => setSeekIndicator(null), 500)
      }
      lastTapTimeRef.current = 0
      lastTapSideRef.current = null
    } else {
      lastTapTimeRef.current = now
      lastTapSideRef.current = side
    }
  }

  const playNextEpisode = () => {
    if (nextEpisode && onVideoSelect) {
      onVideoSelect(nextEpisode)
    }
  }

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 px-4 bg-black bg-opacity-95 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading || !streamUrl}
              className="flex items-center gap-2 px-4 py-2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
              title="Download video"
            >
              {downloading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* PiP Button */}
            <button
              onClick={togglePictureInPicture}
              className="flex items-center gap-2 px-4 py-2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-lg"
              title="Picture in Picture"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16M12 12h8v6h-8z" />
              </svg>
              <span className="hidden sm:inline">PiP</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video Info */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-xl md:text-2xl font-bold text-white break-all">{video.name}</h2>
            {getProviderBadge()}
            {video.subtitles && video.subtitles.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full">
                CC
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>{(video.size / (1024 * 1024)).toFixed(0)} MB</span>
            <span>{new Date(video.uploaded).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl relative">
          {loading && (
            <div className="flex items-center justify-center aspect-video bg-gray-900">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
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
            <div ref={playerContainerRef} className="relative" onTouchEnd={handleDoubleTap}>
              <div data-vjs-player>
                <video ref={videoRef} className="video-js vjs-big-play-centered" />
              </div>

              {/* Resume Prompt */}
              {showResumePrompt && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div className="text-center p-6 bg-gray-800 rounded-xl max-w-sm">
                    <p className="text-white text-lg mb-2">Resume watching?</p>
                    <p className="text-gray-400 mb-4">Continue from {formatTime(savedTime)}</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleResume}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                      >
                        Resume
                      </button>
                      <button
                        onClick={handleStartOver}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Episode Overlay */}
              {showNextEpisode && nextEpisode && (
                <div className="absolute bottom-20 right-4 bg-black/90 p-4 rounded-xl z-10 max-w-xs">
                  <p className="text-gray-400 text-sm mb-1">Up Next</p>
                  <p className="text-white font-medium mb-3 truncate">{nextEpisode.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={playNextEpisode}
                      className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200"
                    >
                      Play Now
                    </button>
                    <button
                      onClick={() => setShowNextEpisode(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Double-tap indicators */}
              {seekIndicator && (
                <div className={`absolute inset-0 pointer-events-none flex items-center ${seekIndicator === 'forward' ? 'justify-end pr-12' : 'justify-start pl-12'
                  }`}>
                  <div className="bg-black/50 rounded-full p-4 animate-ping">
                    <div className="flex items-center gap-1 text-white">
                      {seekIndicator === 'forward' ? (
                        <>
                          <span className="text-lg font-bold">30</span>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                          <span className="text-lg font-bold">30</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Info */}
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-300 font-semibold mb-2">📱 Touch Controls:</p>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Double-tap left → -30s</div>
                <div>Double-tap right → +30s</div>
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm text-gray-300 font-semibold mb-2">⌨️ Keyboard:</p>
              <div className="grid grid-cols-3 gap-1 text-xs text-gray-400">
                <div>Space: Play</div>
                <div>F: Fullscreen</div>
                <div>M: Mute</div>
                <div>C: Subtitles</div>
                <div>P: PiP</div>
                <div>Esc: Close</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
