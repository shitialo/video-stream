import { useState, useEffect } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import VideoLibrary from './components/VideoLibrary'
import VideoPlayer from './components/VideoPlayer'
import axios from 'axios'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('library') // Default to library
  const [storageProvider, setStorageProvider] = useState('r2') // 'r2' or 'do'
  const [availableProviders, setAvailableProviders] = useState({ r2: true, do: false })

  useEffect(() => {
    // Set dark mode class on html element
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    fetchVideos()
  }, [storageProvider])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/.netlify/functions/list-videos?provider=${storageProvider}`)
      setVideos(response.data.videos || [])
      // Update available providers from backend
      if (response.data.availableProviders) {
        setAvailableProviders(response.data.availableProviders)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = () => {
    fetchVideos()
    setActiveTab('library')
  }

  const handleVideoSelect = (video) => {
    setSelectedVideo(video)
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
  }

  const handleProviderChange = (provider) => {
    setStorageProvider(provider)
    setSelectedVideo(null) // Close any open video
    // Switch to library tab when changing providers
    setActiveTab('library')
  }

  // Hide upload tab for DO Spaces (upload only via rclone/CLI)
  const showUploadTab = storageProvider === 'r2'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Provider Toggle */}
        <div className="flex justify-center mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 inline-flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 px-2">Storage:</span>
            <button
              onClick={() => handleProviderChange('r2')}
              disabled={!availableProviders.r2}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${storageProvider === 'r2'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${!availableProviders.r2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Cloudflare R2
              </span>
            </button>
            <button
              onClick={() => handleProviderChange('do')}
              disabled={!availableProviders.do}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${storageProvider === 'do'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${!availableProviders.do ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 5.46 4.45 9.91 9.91 9.91 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91z" />
                </svg>
                DO Spaces
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 inline-flex">
            {showUploadTab && (
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'upload'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('library')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'library'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Library ({videos.length})
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'upload' && showUploadTab ? (
          <UploadSection onUploadComplete={handleUploadComplete} />
        ) : (
          <VideoLibrary
            videos={videos}
            loading={loading}
            onVideoSelect={handleVideoSelect}
            onRefresh={fetchVideos}
            provider={storageProvider}
          />
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
          provider={storageProvider}
        />
      )}
    </div>
  )
}

export default App
