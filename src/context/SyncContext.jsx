import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const SyncContext = createContext(null)

const SYNC_CODE_KEY = 'videostream_sync_code'
const SYNC_ENDPOINT = '/.netlify/functions/sync-progress'

export function SyncProvider({ children }) {
    const [syncCode, setSyncCodeState] = useState(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSynced, setLastSynced] = useState(null)
    const [syncError, setSyncError] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize sync code on mount
    useEffect(() => {
        const initSync = async () => {
            // Check localStorage for existing code
            const storedCode = localStorage.getItem(SYNC_CODE_KEY)

            if (storedCode) {
                setSyncCodeState(storedCode)
                setIsInitialized(true)
            } else {
                // Generate a new code from the server
                try {
                    const response = await axios.get(SYNC_ENDPOINT)
                    if (response.data.code) {
                        localStorage.setItem(SYNC_CODE_KEY, response.data.code)
                        setSyncCodeState(response.data.code)
                    }
                } catch (err) {
                    console.error('Failed to generate sync code:', err)
                    // Generate a local code as fallback
                    const fallbackCode = generateLocalCode()
                    localStorage.setItem(SYNC_CODE_KEY, fallbackCode)
                    setSyncCodeState(fallbackCode)
                }
                setIsInitialized(true)
            }
        }

        initSync()
    }, [])

    // Generate a local fallback code
    const generateLocalCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }

    // Set a new sync code (e.g., when user enters one from another device)
    const setSyncCode = useCallback(async (newCode) => {
        if (!newCode || newCode.length !== 6) {
            setSyncError('Invalid sync code')
            return false
        }

        const formattedCode = newCode.toUpperCase()

        try {
            setIsSyncing(true)
            setSyncError(null)

            // Verify the code exists
            const response = await axios.get(`${SYNC_ENDPOINT}?code=${formattedCode}`)

            if (response.data.code) {
                // Code is valid, save it
                localStorage.setItem(SYNC_CODE_KEY, formattedCode)
                setSyncCodeState(formattedCode)

                // Import the progress from server
                if (response.data.progress && Object.keys(response.data.progress).length > 0) {
                    // Merge with local progress
                    const localProgress = JSON.parse(localStorage.getItem('videoWatchProgress') || '{}')
                    const mergedProgress = { ...localProgress }

                    for (const [key, value] of Object.entries(response.data.progress)) {
                        const local = localProgress[key]
                        if (!local || (value.updatedAt && value.updatedAt > local.updatedAt)) {
                            mergedProgress[key] = value
                        }
                    }

                    localStorage.setItem('videoWatchProgress', JSON.stringify(mergedProgress))
                }

                setLastSynced(Date.now())
                return true
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setSyncError('Sync code not found')
            } else {
                setSyncError('Failed to connect. Try again.')
                console.error('Sync code error:', err)
            }
            return false
        } finally {
            setIsSyncing(false)
        }

        return false
    }, [])

    // Sync current progress to server
    const syncToServer = useCallback(async () => {
        if (!syncCode) return false

        try {
            setIsSyncing(true)
            setSyncError(null)

            const localProgress = JSON.parse(localStorage.getItem('videoWatchProgress') || '{}')

            await axios.post(SYNC_ENDPOINT, {
                code: syncCode,
                progress: localProgress
            })

            setLastSynced(Date.now())
            return true
        } catch (err) {
            console.error('Sync to server failed:', err)
            setSyncError('Sync failed. Will retry.')
            return false
        } finally {
            setIsSyncing(false)
        }
    }, [syncCode])

    // Fetch progress from server
    const syncFromServer = useCallback(async () => {
        if (!syncCode) return false

        try {
            setIsSyncing(true)
            setSyncError(null)

            const response = await axios.get(`${SYNC_ENDPOINT}?code=${syncCode}`)

            if (response.data.progress) {
                const localProgress = JSON.parse(localStorage.getItem('videoWatchProgress') || '{}')
                const mergedProgress = { ...localProgress }

                for (const [key, value] of Object.entries(response.data.progress)) {
                    const local = localProgress[key]
                    if (!local || (value.updatedAt && value.updatedAt > local.updatedAt)) {
                        mergedProgress[key] = value
                    }
                }

                localStorage.setItem('videoWatchProgress', JSON.stringify(mergedProgress))
                setLastSynced(Date.now())
                return true
            }
        } catch (err) {
            console.error('Sync from server failed:', err)
            setSyncError('Could not fetch progress')
            return false
        } finally {
            setIsSyncing(false)
        }

        return false
    }, [syncCode])

    const value = {
        syncCode,
        setSyncCode,
        isSyncing,
        lastSynced,
        syncError,
        isInitialized,
        syncToServer,
        syncFromServer
    }

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    )
}

export function useSync() {
    const context = useContext(SyncContext)
    if (!context) {
        throw new Error('useSync must be used within a SyncProvider')
    }
    return context
}

export default SyncContext
