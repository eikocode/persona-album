'use client'

import { PhotoMetadata } from '@/lib/storage'
import PhotoCard from './PhotoCard'
import UploadCard from './UploadCard'

interface PhotoGalleryProps {
  photos: PhotoMetadata[]
  onDelete: (id: string) => void
  onColorize: (id: string) => void
  onUpload: (file: File) => Promise<void>
  onPhotoClick: (photo: PhotoMetadata) => void
  deletingId: string | null
  colorizingId: string | null
  isUploading: boolean
}

export default function PhotoGallery({
  photos,
  onDelete,
  onColorize,
  onUpload,
  onPhotoClick,
  deletingId,
  colorizingId,
  isUploading,
}: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <UploadCard onUpload={onUpload} isUploading={isUploading} />
        <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
          <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 font-medium text-sm">No photos yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <UploadCard onUpload={onUpload} isUploading={isUploading} />
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onDelete={onDelete}
          onColorize={onColorize}
          onPhotoClick={onPhotoClick}
          isDeleting={deletingId === photo.id}
          isColorizing={colorizingId === photo.id}
        />
      ))}
    </div>
  )
}
