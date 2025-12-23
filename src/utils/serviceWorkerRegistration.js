/**
 * Service Worker Registration Utility
 * 
 * Registers the video caching service worker and provides
 * utilities for cache management.
 */

const SW_PATH = '/sw.js'

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported() {
    return 'serviceWorker' in navigator
}

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
    if (!isServiceWorkerSupported()) {
        console.log('[SW] Service workers not supported')
        return null
    }

    try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
            scope: '/'
        })

        console.log('[SW] Service worker registered:', registration.scope)

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            console.log('[SW] New service worker installing...')

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[SW] New content available, refresh to update')
                }
            })
        })

        return registration
    } catch (error) {
        console.error('[SW] Service worker registration failed:', error)
        return null
    }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker() {
    if (!isServiceWorkerSupported()) return false

    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
        await registration.unregister()
    }
    console.log('[SW] All service workers unregistered')
    return true
}

/**
 * Clear the video cache
 */
export async function clearVideoCache() {
    if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
        return false
    }

    return new Promise((resolve) => {
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data.success)
        }

        navigator.serviceWorker.controller.postMessage(
            { type: 'CLEAR_VIDEO_CACHE' },
            [messageChannel.port2]
        )
    })
}

/**
 * Get video cache size info
 */
export async function getVideoCacheInfo() {
    if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
        return { size: 0, count: 0 }
    }

    return new Promise((resolve) => {
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data)
        }

        navigator.serviceWorker.controller.postMessage(
            { type: 'GET_CACHE_SIZE' },
            [messageChannel.port2]
        )
    })
}

/**
 * Format bytes to human readable string
 */
export function formatCacheSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
