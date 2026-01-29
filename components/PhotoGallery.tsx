'use client'

import { PhotoMetadata } from '@/lib/storage'
import PhotoCard from './PhotoCard'

interface PhotoGalleryProps {
  photos: PhotoMetadata[]
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, photo: PhotoMetadata) => void
  deletingId: string | null
}

export default function PhotoGallery({
  photos,
  onDelete,
  onDragStart,
  deletingId,
}: PhotoGalleryProps) {
  const originalPhotos = photos.filter((p) => !p.isColorized)
  const colorizedPhotos = photos.filter((p) => p.isColorized)

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No photos yet. Upload some to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {originalPhotos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Original Photos ({originalPhotos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {originalPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={onDelete}
                onDragStart={onDragStart}
                isDeleting={deletingId === photo.id}
              />
            ))}
          </div>
        </div>
      )}

      {colorizedPhotos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Colorized Photos ({colorizedPhotos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {colorizedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={onDelete}
                onDragStart={onDragStart}
                isDeleting={deletingId === photo.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
