'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PhotoGallery from '@/components/PhotoGallery'
import ResultPreview from '@/components/ResultPreview'
import { PhotoMetadata } from '@/lib/storage'

interface ColorizeResult {
  original: PhotoMetadata
  colorized: PhotoMetadata
}

export type FilterTab = 'all' | 'original' | 'colorized'

export default function Home() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [colorizingId, setColorizingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [colorizeResult, setColorizeResult] = useState<ColorizeResult | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch('/api/photos')
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      if (response.ok) {
        await fetchPhotos()
      } else {
        const error = await response.json()
        alert(error.error || 'Upload failed')
      }
    } catch {
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      await handleUpload(file)
    }
    e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchPhotos()
      } else {
        alert('Failed to delete photo')
      }
    } catch {
      alert('Failed to delete photo')
    } finally {
      setDeletingId(null)
    }
  }

  const handleColorize = async (photoId: string) => {
    setColorizingId(photoId)
    try {
      const response = await fetch('/api/colorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      })
      if (response.ok) {
        const result = await response.json()
        setColorizeResult(result)
        await fetchPhotos()
      } else {
        const error = await response.json()
        alert(error.error || 'Colorization failed')
      }
    } catch {
      alert('Colorization failed')
    } finally {
      setColorizingId(null)
    }
  }

  const filteredPhotos = photos.filter((p) => {
    if (activeFilter === 'original') return !p.isColorized
    if (activeFilter === 'colorized') return p.isColorized
    return true
  })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'original', label: 'Original' },
    { key: 'colorized', label: 'Colorized' },
  ]

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Photos</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Upload
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeFilter === key
                ? 'text-violet-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {activeFilter === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Gallery */}
      <PhotoGallery
        photos={filteredPhotos}
        onDelete={handleDelete}
        onColorize={handleColorize}
        onUpload={handleUpload}
        deletingId={deletingId}
        colorizingId={colorizingId}
        isUploading={isUploading}
      />

      {colorizeResult && (
        <ResultPreview
          original={colorizeResult.original}
          colorized={colorizeResult.colorized}
          onClose={() => setColorizeResult(null)}
        />
      )}
    </>
  )
}
