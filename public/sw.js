/**
 * Video Caching Service Worker
 * 
 * Caches video byte-range requests for faster subsequent playback.
 * Uses a separate cache for video content with size limits.
 */

const CACHE_NAME = 'video-cache-v1'
const MAX_CACHE_SIZE = 500 * 1024 * 1024 // 500MB max cache size
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.mov']

/**
 * Check if a URL is for a video file
 */
function isVideoRequest(url) {
    const urlLower = url.toLowerCase()
    return VIDEO_EXTENSIONS.some(ext => urlLower.includes(ext))
}

/**
 * Check if this is a range request
 */
function isRangeRequest(request) {
    return request.headers.has('Range')
}

/**
 * Get cache key for a range request
 * We cache the full URL + range for partial content
 */
function getCacheKey(request) {
    const range = request.headers.get('Range') || 'full'
    return `${request.url}|${range}`
}

/**
 * Estimate cache size and cleanup old entries if needed
 */
async function cleanupCache() {
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()

    let totalSize = 0
    const entries = []

    for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
            const blob = await response.clone().blob()
            entries.push({
                request,
                size: blob.size,
                date: response.headers.get('date') || 0
            })
            totalSize += blob.size
        }
    }

    // If over limit, remove oldest entries
    if (totalSize > MAX_CACHE_SIZE) {
        console.log(`[SW] Cache size ${(totalSize / 1024 / 1024).toFixed(1)}MB exceeds limit, cleaning up...`)

        // Sort by date (oldest first)
        entries.sort((a, b) => new Date(a.date) - new Date(b.date))

        while (totalSize > MAX_CACHE_SIZE * 0.8 && entries.length > 0) {
            const oldest = entries.shift()
            await cache.delete(oldest.request)
            totalSize -= oldest.size
            console.log(`[SW] Removed cached entry, freed ${(oldest.size / 1024).toFixed(0)}KB`)
        }
    }
}

/**
 * Handle video requests with caching
 */
async function handleVideoRequest(request) {
    const cache = await caches.open(CACHE_NAME)
    const cacheKey = getCacheKey(request)

    // Check cache first
    const cachedResponse = await cache.match(cacheKey)
    if (cachedResponse) {
        console.log(`[SW] Cache hit: ${request.url.substring(0, 50)}...`)
        return cachedResponse
    }

    // Fetch from network
    try {
        const networkResponse = await fetch(request.clone())

        // Only cache successful responses
        if (networkResponse.ok || networkResponse.status === 206) {
            // Clone response before caching (can only be read once)
            const responseToCache = networkResponse.clone()

            // Don't await - cache in background
            cache.put(cacheKey, responseToCache).then(() => {
                cleanupCache()
            })

            console.log(`[SW] Cached: ${request.url.substring(0, 50)}...`)
        }

        return networkResponse
    } catch (error) {
        console.error('[SW] Fetch failed:', error)

        // Try to return any cached version as fallback
        const fallback = await cache.match(request.url)
        if (fallback) {
            console.log('[SW] Returning fallback from cache')
            return fallback
        }

        throw error
    }
}

/**
 * Install event - precache static assets if needed
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing video cache service worker')
    self.skipWaiting()
})

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating video cache service worker')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('video-cache-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log(`[SW] Deleting old cache: ${name}`)
                        return caches.delete(name)
                    })
            )
        }).then(() => self.clients.claim())
    )
})

/**
 * Fetch event - intercept video requests
 */
self.addEventListener('fetch', (event) => {
    const { request } = event

    // Only handle video requests
    if (request.method === 'GET' && isVideoRequest(request.url)) {
        event.respondWith(handleVideoRequest(request))
        return
    }

    // Pass through all other requests
    event.respondWith(fetch(request))
})

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
    if (event.data.type === 'CLEAR_VIDEO_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Video cache cleared')
            event.ports[0].postMessage({ success: true })
        })
    }

    if (event.data.type === 'GET_CACHE_SIZE') {
        caches.open(CACHE_NAME).then(async (cache) => {
            const keys = await cache.keys()
            let totalSize = 0

            for (const request of keys) {
                const response = await cache.match(request)
                if (response) {
                    const blob = await response.clone().blob()
                    totalSize += blob.size
                }
            }

            event.ports[0].postMessage({
                size: totalSize,
                count: keys.length
            })
        })
    }
})
