'use client'

import Image from 'next/image'
import { PhotoMetadata } from '@/lib/storage'

interface PhotoCardProps {
  photo: PhotoMetadata
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, photo: PhotoMetadata) => void
  isDeleting: boolean
}

export default function PhotoCard({
  photo,
  onDelete,
  onDragStart,
  isDeleting,
}: PhotoCardProps) {
  return (
    <div
      draggable={!photo.isColorized}
      onDragStart={(e) => onDragStart(e, photo)}
      className={`
        relative group rounded-lg overflow-hidden bg-white shadow-sm
        border border-gray-200 transition-all duration-200
        ${!photo.isColorized ? 'cursor-grab hover:shadow-md active:cursor-grabbing' : ''}
        ${isDeleting ? 'opacity-50' : ''}
      `}
    >
      <div className="aspect-square relative">
        <Image
          src={photo.url}
          alt={photo.originalName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {photo.isColorized && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
          Colorized
        </div>
      )}

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(photo.id)
          }}
          disabled={isDeleting}
          className="
            absolute top-2 right-2 p-1.5 rounded-full
            bg-red-500 text-white opacity-0 group-hover:opacity-100
            hover:bg-red-600 transition-all duration-200
            disabled:opacity-50
          "
          title="Delete photo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {!photo.isColorized && (
        <div className="absolute bottom-2 left-2 right-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            Drag to colorize
          </span>
        </div>
      )}
    </div>
  )
}
