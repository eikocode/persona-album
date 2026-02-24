'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { PhotoMetadata, PhotoTags } from '@/lib/storage'

interface PhotoTagPanelProps {
  photo: PhotoMetadata | null
  onClose: () => void
  onColorize: (id: string) => void
  onTagsUpdate: (id: string, tags: PhotoTags) => void
  colorizingId: string | null
}

export default function PhotoTagPanel({
  photo,
  onClose,
  onColorize,
  onTagsUpdate,
  colorizingId,
}: PhotoTagPanelProps) {
  const [tags, setTags] = useState<PhotoTags>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [brightenToast, setBrightenToast] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (photo) {
      setTags(photo.tags ?? {})
      setSaved(false)
    }
  }, [photo])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!photo) return null

  const isColorizing = colorizingId === photo.id

  async function handleSave() {
    if (!photo) return
    setSaving(true)
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      })
      if (res.ok) {
        onTagsUpdate(photo.id, tags)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  function handleBrighten() {
    setBrightenToast(true)
    setTimeout(() => setBrightenToast(false), 2500)
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Photo tag panel"
    >
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Photo Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo preview */}
        <div className="relative aspect-video w-full bg-gray-100 shrink-0">
          <Image
            src={photo.url}
            alt={photo.originalName}
            fill
            className="object-contain"
            sizes="448px"
          />
          {photo.isColorized && (
            <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              Colorized
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-6 py-4 border-b border-gray-200">
          {!photo.isColorized && (
            <button
              onClick={() => onColorize(photo.id)}
              disabled={isColorizing}
              className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-4
                         bg-bio-primary text-white font-medium rounded-lg
                         hover:bg-blue-700 transition-colors disabled:opacity-50"
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
          <button
            onClick={handleBrighten}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-4
                       bg-gray-100 text-gray-700 font-medium rounded-lg
                       hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            Brighten
          </button>
        </div>

        {/* Brighten toast */}
        {brightenToast && (
          <div className="mx-6 mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg">
            Brightness enhancement coming soon
          </div>
        )}

        {/* Tag form */}
        <div className="flex-1 px-6 py-4 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">Tags</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tag-people">
              People
            </label>
            <input
              id="tag-people"
              type="text"
              placeholder="e.g. Grandma Rose, Uncle Bob"
              value={tags.people ?? ''}
              onChange={e => setTags(t => ({ ...t, people: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-bio-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated names</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tag-location">
              Location
            </label>
            <input
              id="tag-location"
              type="text"
              placeholder="e.g. Brooklyn, NY"
              value={tags.location ?? ''}
              onChange={e => setTags(t => ({ ...t, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-bio-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tag-event">
              Event
            </label>
            <input
              id="tag-event"
              type="text"
              placeholder="e.g. Wedding, Family Reunion"
              value={tags.event ?? ''}
              onChange={e => setTags(t => ({ ...t, event: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-bio-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tag-date">
              Date
            </label>
            <input
              id="tag-date"
              type="date"
              value={tags.date ?? ''}
              onChange={e => setTags(t => ({ ...t, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-bio-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tag-caption">
              Caption
            </label>
            <textarea
              id="tag-caption"
              rows={3}
              placeholder="Describe what's happening in this photo…"
              value={tags.caption ?? ''}
              onChange={e => setTags(t => ({ ...t, caption: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-bio-primary focus:border-transparent
                         resize-none"
            />
          </div>
        </div>

        {/* Save footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 min-h-[44px]
                       bg-bio-primary text-white font-medium rounded-lg
                       hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving…
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              'Save Tags'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
