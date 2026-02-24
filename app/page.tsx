'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PhotoGallery from '@/components/PhotoGallery'
import WritingArea, { WritingAreaHandle } from '@/components/WritingArea'
import PhotoTagPanel from '@/components/PhotoTagPanel'
import ResultPreview from '@/components/ResultPreview'
import CoPilot from '@/components/CoPilot'
import { PhotoMetadata, PhotoTags } from '@/lib/storage'

interface ColorizeResult {
  original: PhotoMetadata
  colorized: PhotoMetadata
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [colorizingId, setColorizingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [colorizeResult, setColorizeResult] = useState<ColorizeResult | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null)
  const [proactiveTrigger, setProactiveTrigger] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const writingAreaRef = useRef<WritingAreaHandle>(null)
  const proactiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getCurrentText = useCallback(() => {
    return writingAreaRef.current?.getBody() ?? ''
  }, [])

  const handleContentChange = useCallback((text: string) => {
    if (proactiveTimer.current) clearTimeout(proactiveTimer.current)
    proactiveTimer.current = setTimeout(() => {
      if (text.trim().length > 80) {
        setProactiveTrigger(text)
      }
    }, 4000)
  }, [])

  const handleInsertText = useCallback((text: string) => {
    writingAreaRef.current?.appendText(text)
  }, [])

  const handleReplaceText = useCallback((original: string, corrected: string) => {
    writingAreaRef.current?.replaceWord(original, corrected)
  }, [])

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
        if (selectedPhoto?.id === id) setSelectedPhoto(null)
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

  const handleTagsUpdate = (id: string, tags: PhotoTags) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, tags } : p))
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(prev => prev ? { ...prev, tags } : prev)
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left panel — Photos (28%) */}
      <div className="w-[28%] bg-bio-surface border-r border-bio-border flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bio-border bg-white shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            Photos{photos.length > 0 && <span className="ml-1.5 text-sm font-normal text-gray-400">({photos.length})</span>}
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] bg-bio-primary hover:bg-blue-700
                       text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
                Upload photo
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

        {/* Scrollable gallery */}
        <div className="flex-1 overflow-y-auto p-3">
          <PhotoGallery
            photos={photos}
            onDelete={handleDelete}
            onColorize={handleColorize}
            onUpload={handleUpload}
            onPhotoClick={setSelectedPhoto}
            deletingId={deletingId}
            colorizingId={colorizingId}
            isUploading={isUploading}
          />
        </div>
      </div>

      {/* Right panel — Writing (60%) + Co-pilot (40%) */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-[60] overflow-y-auto bg-gray-100 border-r border-bio-border">
          <WritingArea ref={writingAreaRef} photos={photos} onContentChange={handleContentChange} />
        </div>
        <div className="flex-[40] overflow-hidden flex flex-col bg-bio-surface">
          <CoPilot
            photos={photos}
            getCurrentText={getCurrentText}
            onInsertText={handleInsertText}
            onReplaceText={handleReplaceText}
            proactiveTrigger={proactiveTrigger}
          />
        </div>
      </div>

      {/* Photo tag panel (slide-in overlay) */}
      {selectedPhoto && (
        <PhotoTagPanel
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onColorize={handleColorize}
          onTagsUpdate={handleTagsUpdate}
          colorizingId={colorizingId}
        />
      )}

      {colorizeResult && (
        <ResultPreview
          original={colorizeResult.original}
          colorized={colorizeResult.colorized}
          onClose={() => setColorizeResult(null)}
        />
      )}
    </div>
  )
}
