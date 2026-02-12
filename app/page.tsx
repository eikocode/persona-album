'use client'

import { useState, useEffect, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import PhotoGallery from '@/components/PhotoGallery'
import ColorizeZone from '@/components/ColorizeZone'
import ResultPreview from '@/components/ResultPreview'
import { PhotoMetadata } from '@/lib/storage'

interface ColorizeResult {
  original: PhotoMetadata
  colorized: PhotoMetadata
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isColorizing, setIsColorizing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [colorizeResult, setColorizeResult] = useState<ColorizeResult | null>(null)

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

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchPhotos()
      } else {
        const error = await response.json()
        alert(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPhotos()
      } else {
        alert('Failed to delete photo')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete photo')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, photo: PhotoMetadata) => {
    e.dataTransfer.setData('photoId', photo.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleColorize = async (photoId: string) => {
    setIsColorizing(true)
    try {
      const response = await fetch('/api/colorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    } catch (error) {
      console.error('Colorization failed:', error)
      alert('Colorization failed')
    } finally {
      setIsColorizing(false)
    }
  }

  return (
    <main className="min-h-screen bg-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Photo Colorization Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Upload black & white photos and bring them to life with color
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Upload Photos
            </h2>
            <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Colorize
            </h2>
            <ColorizeZone
              onColorize={handleColorize}
              isProcessing={isColorizing}
            />
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Photo Gallery
          </h2>
          <PhotoGallery
            photos={photos}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            deletingId={deletingId}
          />
        </section>
      </div>

      {colorizeResult && (
        <ResultPreview
          original={colorizeResult.original}
          colorized={colorizeResult.colorized}
          onClose={() => setColorizeResult(null)}
        />
      )}
    </main>
  )
}
