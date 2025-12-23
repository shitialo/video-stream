import { useState } from 'react'
import { useSync } from '../context/SyncContext'

function SyncSettings({ onClose }) {
    const {
        syncCode,
        setSyncCode,
        isSyncing,
        lastSynced,
        syncError,
        syncToServer,
        syncFromServer
    } = useSync()

    const [inputCode, setInputCode] = useState('')
    const [showInput, setShowInput] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopyCode = async () => {
        if (syncCode) {
            await navigator.clipboard.writeText(syncCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSubmitCode = async () => {
        if (inputCode.length === 6) {
            const success = await setSyncCode(inputCode)
            if (success) {
                setShowInput(false)
                setInputCode('')
            }
        }
    }

    const handleSync = async () => {
        await syncToServer()
        await syncFromServer()
    }

    const formatLastSynced = () => {
        if (!lastSynced) return 'Never'
        const diff = Date.now() - lastSynced
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return new Date(lastSynced).toLocaleDateString()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Sync Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Your Sync Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Your Sync Code
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-900 rounded-lg px-4 py-3 font-mono text-2xl text-white tracking-widest text-center">
                                {syncCode || '------'}
                            </div>
                            <button
                                onClick={handleCopyCode}
                                disabled={!syncCode}
                                className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Share this code to sync your watch progress on another device
                        </p>
                    </div>

                    {/* Enter Code from Another Device */}
                    <div>
                        <button
                            onClick={() => setShowInput(!showInput)}
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                        >
                            {showInput ? 'Cancel' : '+ Enter code from another device'}
                        </button>

                        {showInput && (
                            <div className="mt-3 space-y-3">
                                <input
                                    type="text"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="Enter 6-character code"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-xl tracking-widest text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    maxLength={6}
                                />
                                <button
                                    onClick={handleSubmitCode}
                                    disabled={inputCode.length !== 6 || isSyncing}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                                >
                                    {isSyncing ? 'Syncing...' : 'Link Device'}
                                </button>
                                {syncError && (
                                    <p className="text-red-400 text-sm text-center">{syncError}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sync Status */}
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">Last synced:</span>
                            <span className="text-sm text-white">{formatLastSynced()}</span>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing || !syncCode}
                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isSyncing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Sync Now
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <p className="text-xs text-gray-400">
                            💡 <strong>How it works:</strong> Your watch progress is automatically saved.
                            Use the same sync code on multiple devices to keep them in sync.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SyncSettings
