import { useState, useRef } from 'react'
import axios from 'axios'

function UploadSection({ onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('') // 'success', 'error', ''
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, WebM, OGG, MOV, AVI)')
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 500MB')
      return
    }

    setSelectedFile(file)
    setUploadStatus('')
    
    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const uploadFile = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setUploadProgress(0)
      setUploadStatus('')

      // Step 1: Get presigned URL from our Netlify function
      const { data } = await axios.post('/.netlify/functions/get-upload-url', {
        filename: selectedFile.name,
        contentType: selectedFile.type
      })

      // Step 2: Upload directly to R2 using presigned URL
      await axios.put(data.uploadUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })

      // Success!
      setUploadStatus('success')
      setUploadProgress(100)
      
      // Clean up
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setUploadProgress(0)
        setUploadStatus('')
        if (onUploadComplete) {
          onUploadComplete()
        }
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      alert('Upload failed: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Upload Area */}
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Upload Your Video
          </h2>
          
          <div
            className={`relative border-3 border-dashed rounded-xl p-12 transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleChange}
              className="hidden"
              disabled={uploading}
            />

            {!selectedFile ? (
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Drag and drop your video here
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Supports: MP4, WebM, OGG, MOV, AVI (Max 500MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Preview */}
                {previewUrl && (
                  <div className="mb-4">
                    <video
                      src={previewUrl}
                      controls
                      className="w-full max-h-64 rounded-lg bg-black"
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={clearSelection}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {uploadProgress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-300">Uploading...</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {uploadStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Upload successful! Redirecting to library...
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Upload failed. Please try again.
                  </div>
                )}

                {/* Upload Button */}
                {!uploading && uploadStatus === '' && (
                  <button
                    onClick={uploadFile}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
                  >
                    Upload to Cloud
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadSection

