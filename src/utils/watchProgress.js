/**
 * Watch Progress Utilities
 * Manages video watch progress using localStorage
 */

const STORAGE_KEY = 'videoWatchProgress'
const RECENTLY_WATCHED_KEY = 'recentlyWatched'
const WATCHED_THRESHOLD = 0.9 // 90% = considered "watched"

/**
 * Get all progress data from localStorage
 */
function getAllProgress() {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : {}
    } catch {
        return {}
    }
}

/**
 * Save all progress data to localStorage
 */
function saveAllProgress(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error('Failed to save progress:', e)
    }
}

/**
 * Save progress for a specific video
 * @param {string} videoKey - Unique video identifier
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} duration - Total video duration in seconds
 */
export function saveProgress(videoKey, currentTime, duration) {
    if (!videoKey || !duration || duration === 0) return

    const progress = getAllProgress()
    progress[videoKey] = {
        currentTime,
        duration,
        percent: (currentTime / duration) * 100,
        updatedAt: Date.now()
    }
    saveAllProgress(progress)

    // Update recently watched list
    updateRecentlyWatched(videoKey)
}

/**
 * Get progress for a specific video
 * @param {string} videoKey - Unique video identifier
 * @returns {object|null} Progress data or null
 */
export function getProgress(videoKey) {
    const progress = getAllProgress()
    return progress[videoKey] || null
}

/**
 * Get progress percentage for a video (0-100)
 * @param {string} videoKey - Unique video identifier
 * @returns {number} Progress percentage (0-100)
 */
export function getProgressPercent(videoKey) {
    const progress = getProgress(videoKey)
    return progress ? Math.min(100, Math.round(progress.percent)) : 0
}

/**
 * Check if video is considered "watched" (90%+ complete)
 * @param {string} videoKey - Unique video identifier
 * @returns {boolean}
 */
export function isWatched(videoKey) {
    const progress = getProgress(videoKey)
    return progress ? progress.percent >= WATCHED_THRESHOLD * 100 : false
}

/**
 * Mark video as fully watched
 * @param {string} videoKey - Unique video identifier
 * @param {number} duration - Total video duration
 */
export function markAsWatched(videoKey, duration) {
    saveProgress(videoKey, duration, duration)
}

/**
 * Clear progress for a specific video
 * @param {string} videoKey - Unique video identifier
 */
export function clearProgress(videoKey) {
    const progress = getAllProgress()
    delete progress[videoKey]
    saveAllProgress(progress)
}

/**
 * Update recently watched list
 * @param {string} videoKey - Unique video identifier
 */
function updateRecentlyWatched(videoKey) {
    try {
        const data = localStorage.getItem(RECENTLY_WATCHED_KEY)
        let recent = data ? JSON.parse(data) : []

        // Remove if already exists
        recent = recent.filter(key => key !== videoKey)

        // Add to front
        recent.unshift(videoKey)

        // Keep only last 20
        recent = recent.slice(0, 20)

        localStorage.setItem(RECENTLY_WATCHED_KEY, JSON.stringify(recent))
    } catch (e) {
        console.error('Failed to update recently watched:', e)
    }
}

/**
 * Get list of recently watched video keys
 * @returns {string[]} Array of video keys
 */
export function getRecentlyWatched() {
    try {
        const data = localStorage.getItem(RECENTLY_WATCHED_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

/**
 * Get all videos that are in progress (started but not finished)
 * @returns {object[]} Array of {videoKey, percent, currentTime, duration}
 */
export function getInProgressVideos() {
    const progress = getAllProgress()
    return Object.entries(progress)
        .filter(([_, data]) => data.percent > 5 && data.percent < 90) // Between 5% and 90%
        .map(([videoKey, data]) => ({
            videoKey,
            percent: data.percent,
            currentTime: data.currentTime,
            duration: data.duration,
            updatedAt: data.updatedAt
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt) // Most recent first
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'

    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse episode info from video name
 * @param {string} name - Video name
 * @returns {object|null} { series, season, episode } or null
 */
export function parseEpisodeInfo(name) {
    // Match patterns like S01E05, S1E5, Season 1 Episode 5
    const patterns = [
        /^(.+?)[.\s_-]*[Ss](\d+)[Ee](\d+)/,  // Show.Name.S01E05
        /^(.+?)[.\s_-]*Season\s*(\d+)\s*Episode\s*(\d+)/i,  // Show Name Season 1 Episode 5
        /^(.+?)[.\s_-]*(\d+)x(\d+)/,  // Show.Name.1x05
    ]

    for (const pattern of patterns) {
        const match = name.match(pattern)
        if (match) {
            return {
                series: match[1].replace(/[._]/g, ' ').trim(),
                season: parseInt(match[2]),
                episode: parseInt(match[3])
            }
        }
    }

    return null
}

/**
 * Find next episode in a list of videos
 * @param {object} currentVideo - Current video object
 * @param {object[]} allVideos - Array of all video objects
 * @returns {object|null} Next video or null
 */
export function findNextEpisode(currentVideo, allVideos) {
    const currentInfo = parseEpisodeInfo(currentVideo.name)
    if (!currentInfo) return null

    // Find videos from same series
    const seriesVideos = allVideos
        .map(v => ({ ...v, info: parseEpisodeInfo(v.name) }))
        .filter(v => v.info && v.info.series.toLowerCase() === currentInfo.series.toLowerCase())
        .sort((a, b) => {
            if (a.info.season !== b.info.season) return a.info.season - b.info.season
            return a.info.episode - b.info.episode
        })

    // Find current position and return next
    const currentIndex = seriesVideos.findIndex(v => v.key === currentVideo.key)
    if (currentIndex >= 0 && currentIndex < seriesVideos.length - 1) {
        return seriesVideos[currentIndex + 1]
    }

    return null
}

/**
 * Group videos by series and season
 * @param {object[]} videos - Array of video objects
 * @returns {object} Grouped structure { seriesName: { seasonNum: [videos] } }
 */
export function groupVideosBySeries(videos) {
    const grouped = {}
    const ungrouped = []

    videos.forEach(video => {
        const info = parseEpisodeInfo(video.name)

        if (info) {
            if (!grouped[info.series]) {
                grouped[info.series] = {}
            }
            if (!grouped[info.series][info.season]) {
                grouped[info.series][info.season] = []
            }
            grouped[info.series][info.season].push({
                ...video,
                episodeInfo: info
            })
        } else {
            ungrouped.push(video)
        }
    })

    // Sort episodes within each season
    Object.values(grouped).forEach(series => {
        Object.values(series).forEach(episodes => {
            episodes.sort((a, b) => a.episodeInfo.episode - b.episodeInfo.episode)
        })
    })

    return { grouped, ungrouped }
}
