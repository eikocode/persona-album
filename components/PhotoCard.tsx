'use client'

import Image from 'next/image'
import { PhotoMetadata } from '@/lib/storage'

interface PhotoCardProps {
  photo: PhotoMetadata
  onDelete: (id: string) => void
  onColorize: (id: string) => void
  isDeleting: boolean
  isColorizing: boolean
}

export default function PhotoCard({
  photo,
  onDelete,
  onColorize,
  isDeleting,
  isColorizing,
}: PhotoCardProps) {
  const date = new Date(photo.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl
        transition-all duration-200 hover:-translate-y-1 cursor-pointer
        ${isDeleting ? 'opacity-50' : ''}`}
    >
      {/* Image area */}
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={photo.url}
          alt={photo.originalName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          {/* Colorize button — only for non-colorized photos */}
          {!photo.isColorized && (
            <button
              onClick={(e) => { e.stopPropagation(); onColorize(photo.id) }}
              disabled={isColorizing || isDeleting}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium
                         rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isColorizing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Colorizing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Colorize
                </>
              )}
            </button>
          )}

          {/* Delete button — top-right */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(photo.id) }}
            disabled={isDeleting || isColorizing}
            className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-red-500 text-white
                       rounded-full transition-colors disabled:opacity-50"
            title="Delete photo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Colorized badge */}
        {photo.isColorized && (
          <div className="absolute bottom-2 left-2 bg-teal-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            Colorized
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-gray-800 truncate">{photo.originalName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
    </article>
  )
}
