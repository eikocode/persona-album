'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import PageCanvas, { PageCanvasHandle } from './PageCanvas'
import PageControls from './PageControls'

const STORAGE_KEY_TITLE = 'biography-title'
const STORAGE_KEY_PAGES = 'biography-pages'
const STORAGE_KEY_BODY_LEGACY = 'biography-body'
const DEBOUNCE_MS = 800

export interface WritingAreaHandle {
  getBody: () => string
  appendText: (text: string) => void
  replaceWord: (original: string, corrected: string) => void
}

export interface WritingAreaProps {
  photos?: unknown[]
  onContentChange?: (text: string) => void
}

interface PageData {
  id: string
  content: object
}

const emptyDoc = (): object => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})

function plainTextToTipTapDoc(text: string): object {
  const paragraphs = text.split(/\n\n+/).map(para => ({
    type: 'paragraph',
    content: para.trim() ? [{ type: 'text', text: para.trim() }] : [],
  }))
  return {
    type: 'doc',
    content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }],
  }
}

function loadPages(): PageData[] {
  // Try new format first
  const raw = localStorage.getItem(STORAGE_KEY_PAGES)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // fall through to migration
    }
  }

  // Migrate from legacy single-editor format
  const legacy = localStorage.getItem(STORAGE_KEY_BODY_LEGACY) ?? ''
  let content: object
  try {
    const parsed = JSON.parse(legacy)
    content = parsed?.type === 'doc' ? parsed : plainTextToTipTapDoc(legacy)
  } catch {
    content = plainTextToTipTapDoc(legacy)
  }
  return [{ id: crypto.randomUUID(), content }]
}

const WritingArea = forwardRef<WritingAreaHandle, WritingAreaProps>(
  function WritingArea({ onContentChange }, ref) {
    const [title, setTitle] = useState('')
    const [pages, setPages] = useState<PageData[]>([])
    const [mounted, setMounted] = useState(false)
    const [wordCount, setWordCount] = useState(0)
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

    const pageRefs = useRef<(PageCanvasHandle | null)[]>([])
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Keep onContentChange stable so PageCanvas closures don't go stale
    const onContentChangeRef = useRef(onContentChange)
    useEffect(() => { onContentChangeRef.current = onContentChange }, [onContentChange])

    useEffect(() => {
      setTitle(localStorage.getItem(STORAGE_KEY_TITLE) ?? '')
      setPages(loadPages())
      setMounted(true)
    }, [])

    const scheduleSave = useCallback((updatedPages: PageData[]) => {
      setSaveState('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(updatedPages))
        setSaveState('saved')
        savedTimer.current = setTimeout(() => setSaveState('idle'), 2000)
      }, DEBOUNCE_MS)
    }, [])

    const handlePageUpdate = useCallback((pageIndex: number, json: object) => {
      setPages(prev => {
        const next = prev.map((p, i) => (i === pageIndex ? { ...p, content: json } : p))
        scheduleSave(next)
        return next
      })
      // Recount words across all pages
      const total = (pageRefs.current ?? [])
        .filter(Boolean)
        .reduce((sum, r) => sum + (r!.getText().trim().split(/\s+/).filter(Boolean).length), 0)
      setWordCount(total)
      // Notify parent for proactive spell check
      const allText = (pageRefs.current ?? [])
        .filter(Boolean)
        .map(r => r!.getText())
        .join('\n\n')
      onContentChangeRef.current?.(allText)
    }, [scheduleSave])

    function addPage(afterIndex: number) {
      const newPage: PageData = { id: crypto.randomUUID(), content: emptyDoc() }
      setPages(prev => {
        const next = [
          ...prev.slice(0, afterIndex + 1),
          newPage,
          ...prev.slice(afterIndex + 1),
        ]
        scheduleSave(next)
        return next
      })
    }

    function deletePage(index: number) {
      setPages(prev => {
        if (prev.length <= 1) return prev
        const next = prev.filter((_, i) => i !== index)
        scheduleSave(next)
        return next
      })
    }

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value
      setTitle(val)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY_TITLE, val)
      }, DEBOUNCE_MS)
    }

    useImperativeHandle(ref, () => ({
      getBody: () =>
        pageRefs.current
          .filter(Boolean)
          .map(r => r!.getText())
          .join('\n\n'),

      appendText: (text: string) => {
        const refs = pageRefs.current.filter(Boolean)
        if (refs.length === 0) return
        const last = refs[refs.length - 1]!
        last.appendText(text)
        // Persist updated JSON from last page
        setPages(prev => {
          const next = prev.map((p, i) =>
            i === prev.length - 1 ? { ...p, content: last.getJSON() } : p
          )
          scheduleSave(next)
          return next
        })
      },

      replaceWord: (original: string, corrected: string) => {
        for (const r of pageRefs.current) {
          if (!r) continue
          const replaced = r.replaceWord(original, corrected)
          if (replaced) {
            // Persist the updated page
            setPages(prev => {
              const idx = pageRefs.current.indexOf(r)
              if (idx === -1) return prev
              const next = prev.map((p, i) =>
                i === idx ? { ...p, content: r.getJSON() } : p
              )
              scheduleSave(next)
              return next
            })
            break
          }
        }
      },
    }), [scheduleSave])

    if (!mounted) return null

    return (
      <div className="flex flex-col items-center py-10 gap-6 min-h-full">
        {/* Title — same width as pages */}
        <div style={{ width: 816 }}>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="My Life Story"
            className="w-full text-3xl font-bold text-gray-900 border-none outline-none
                       placeholder-gray-300 bg-transparent leading-tight"
            aria-label="Biography title"
          />
        </div>

        {/* Pages */}
        {pages.map((page, i) => (
          <div key={page.id} className="flex flex-col items-center gap-6">
            <PageCanvas
              ref={(el) => { pageRefs.current[i] = el }}
              content={page.content}
              pageIndex={i}
              pageNumber={i + 1}
              onUpdate={handlePageUpdate}
              onContentChange={onContentChangeRef.current}
            />
            <PageControls
              afterIndex={i}
              totalPages={pages.length}
              onAddPage={addPage}
              onDeletePage={deletePage}
            />
          </div>
        ))}

        {/* Word count + save indicator */}
        <div
          className="flex items-center justify-end gap-3 text-sm text-gray-400 select-none pb-10"
          style={{ width: 816 }}
        >
          {saveState === 'saving' && <span className="text-xs">Saving…</span>}
          {saveState === 'saved' && (
            <span className="text-xs flex items-center gap-1">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <span>{wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>
      </div>
    )
  }
)

export default WritingArea
