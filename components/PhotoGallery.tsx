'use client'

import { PhotoMetadata } from '@/lib/storage'
import PhotoCard from './PhotoCard'
import UploadCard from './UploadCard'

interface PhotoGalleryProps {
  photos: PhotoMetadata[]
  onDelete: (id: string) => void
  onColorize: (id: string) => void
  onUpload: (file: File) => Promise<void>
  deletingId: string | null
  colorizingId: string | null
  isUploading: boolean
}

export default function PhotoGallery({
  photos,
  onDelete,
  onColorize,
  onUpload,
  deletingId,
  colorizingId,
  isUploading,
}: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Upload card always first */}
        <UploadCard onUpload={onUpload} isUploading={isUploading} />

        {/* Empty state spans remaining columns */}
        <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 font-medium mb-1">No photos yet</p>
          <p className="text-sm text-gray-400">Upload some photos to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {/* Upload card always at position 0 */}
      <UploadCard onUpload={onUpload} isUploading={isUploading} />

      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onDelete={onDelete}
          onColorize={onColorize}
          isDeleting={deletingId === photo.id}
          isColorizing={colorizingId === photo.id}
        />
      ))}
    </div>
  )
}
