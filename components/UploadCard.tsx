'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadCardProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export default function UploadCard({ onUpload, isUploading }: UploadCardProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await onUpload(file)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    disabled: isUploading,
  })

  return (
    <article
      {...getRootProps()}
      className={`bg-white rounded-2xl border-2 border-dashed transition-all duration-200
        cursor-pointer flex flex-col items-center justify-center aspect-square
        ${isDragActive
          ? 'border-violet-400 bg-violet-50'
          : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50'
        }
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <>
          <svg className="animate-spin w-10 h-10 text-violet-400 mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm font-medium text-violet-500">Uploading…</span>
        </>
      ) : (
        <>
          <svg className="w-10 h-10 text-violet-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {isDragActive ? 'Drop here' : 'Upload Photo'}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP</span>
        </>
      )}
    </article>
  )
}
