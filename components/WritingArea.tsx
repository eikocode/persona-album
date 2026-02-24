'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { PhotoMetadata } from '@/lib/storage'

const STORAGE_KEY_TITLE = 'biography-title'
const STORAGE_KEY_BODY = 'biography-body'
const DEBOUNCE_MS = 800

export interface WritingAreaHandle {
  getBody: () => string
  appendText: (text: string) => void
}

export interface WritingAreaProps {
  photos?: PhotoMetadata[]
}

const WritingArea = forwardRef<WritingAreaHandle, WritingAreaProps>(
  function WritingArea(_props, ref) {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [mounted, setMounted] = useState(false)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const bodyRef = useRef('')

    useEffect(() => {
      const savedTitle = localStorage.getItem(STORAGE_KEY_TITLE) ?? ''
      const savedBody = localStorage.getItem(STORAGE_KEY_BODY) ?? ''
      setTitle(savedTitle)
      setBody(savedBody)
      bodyRef.current = savedBody
      setMounted(true)
    }, [])

    // Keep bodyRef in sync with body state for synchronous reads
    useEffect(() => {
      bodyRef.current = body
    }, [body])

    useImperativeHandle(ref, () => ({
      getBody: () => bodyRef.current,
      appendText: (text: string) => {
        setBody(prev => {
          const separator = prev.trim() === '' ? '' : '\n\n'
          const next = prev + separator + text
          localStorage.setItem(STORAGE_KEY_BODY, next)
          return next
        })
      },
    }))

    const scheduleAutosave = useCallback((nextTitle: string, nextBody: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY_TITLE, nextTitle)
        localStorage.setItem(STORAGE_KEY_BODY, nextBody)
      }, DEBOUNCE_MS)
    }, [])

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value
      setTitle(val)
      scheduleAutosave(val, body)
    }

    function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const val = e.target.value
      setBody(val)
      scheduleAutosave(title, val)
    }

    const wordCount = body.trim() === '' ? 0 : body.trim().split(/\s+/).length

    if (!mounted) return null

    return (
      <div className="flex flex-col h-full px-8 py-6">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="My Life Story"
          className="w-full text-3xl font-bold text-gray-900 border-none outline-none
                     placeholder-gray-300 bg-transparent mb-6 leading-tight"
          aria-label="Biography title"
        />

        <div className="w-full border-b border-gray-200 mb-6" />

        {/* Body textarea */}
        <textarea
          value={body}
          onChange={handleBodyChange}
          placeholder="Start writing your life story…"
          className="writing-area flex-1 w-full border-none outline-none resize-none
                     text-gray-900 placeholder-gray-300 bg-transparent"
          aria-label="Biography body"
        />

        {/* Word count */}
        <div className="mt-4 text-right text-sm text-gray-400 select-none">
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </div>
    )
  }
)

export default WritingArea
