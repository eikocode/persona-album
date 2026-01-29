'use client'

import { useState } from 'react'

interface ColorizeZoneProps {
  onColorize: (photoId: string) => Promise<void>
  isProcessing: boolean
}

export default function ColorizeZone({ onColorize, isProcessing }: ColorizeZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (isProcessing) return

    const photoId = e.dataTransfer.getData('photoId')
    if (photoId) {
      await onColorize(photoId)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center
        transition-all duration-200 min-h-[200px]
        flex flex-col items-center justify-center
        ${isDragOver ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-gray-300'}
        ${isProcessing ? 'opacity-50' : ''}
      `}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
          <p className="text-purple-600 font-medium">Colorizing photo...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
        </>
      ) : isDragOver ? (
        <>
          <svg
            className="w-16 h-16 text-purple-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <p className="text-purple-600 font-medium text-lg">Drop to colorize!</p>
        </>
      ) : (
        <>
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <p className="text-gray-600 font-medium">Colorization Zone</p>
          <p className="text-sm text-gray-400 mt-1">
            Drag a photo here to add color
          </p>
        </>
      )}
    </div>
  )
}
