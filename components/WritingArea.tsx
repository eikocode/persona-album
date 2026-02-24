'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { PhotoMetadata } from '@/lib/storage'

const STORAGE_KEY_TITLE = 'biography-title'
const STORAGE_KEY_BODY = 'biography-body'
const DEBOUNCE_MS = 800

export interface WritingAreaHandle {
  getBody: () => string
  appendText: (text: string) => void
  replaceWord: (original: string, corrected: string) => void
}

export interface WritingAreaProps {
  photos?: PhotoMetadata[]
  onContentChange?: (text: string) => void
}

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

const WritingArea = forwardRef<WritingAreaHandle, WritingAreaProps>(
  function WritingArea({ onContentChange }, ref) {
    const [title, setTitle] = useState('')
    const [mounted, setMounted] = useState(false)
    const [wordCount, setWordCount] = useState(0)
    const [initialContent, setInitialContent] = useState<object>({ type: 'doc', content: [{ type: 'paragraph' }] })
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      const savedTitle = localStorage.getItem(STORAGE_KEY_TITLE) ?? ''
      setTitle(savedTitle)

      const raw = localStorage.getItem(STORAGE_KEY_BODY) ?? ''
      let content: object
      try {
        const parsed = JSON.parse(raw)
        content = parsed?.type === 'doc' ? parsed : plainTextToTipTapDoc(raw)
      } catch {
        content = plainTextToTipTapDoc(raw)
      }
      localStorage.setItem(STORAGE_KEY_BODY, JSON.stringify(content))
      setInitialContent(content)
      setMounted(true)
    }, [])

    const editor = useEditor({
      extensions: [
        StarterKit,
        ImageExtension.configure({ inline: false, allowBase64: false }),
        Placeholder.configure({ placeholder: 'Start writing your life story…' }),
      ],
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      editorProps: {
        attributes: { class: 'writing-area focus:outline-none min-h-[400px]', spellcheck: 'true' },
        handleDrop(view, event, _slice, moved) {
          if (moved) return false
          const url = event.dataTransfer?.getData('text/x-photo-url')
          const alt = event.dataTransfer?.getData('text/x-photo-name') ?? ''
          if (!url) return false
          event.preventDefault()
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!coords) return false
          const node = view.state.schema.nodes.image.create({ src: url, alt })
          view.dispatch(view.state.tr.insert(coords.pos, node))
          return true
        },
      },
      onUpdate({ editor }) {
        localStorage.setItem(STORAGE_KEY_BODY, JSON.stringify(editor.getJSON()))
        setWordCount(editor.getText().trim().split(/\s+/).filter(Boolean).length)
        onContentChange?.(editor.getText())
      },
    })

    // Apply persisted content once mounted
    useEffect(() => {
      if (mounted && editor && initialContent) {
        editor.commands.setContent(initialContent)
        const text = editor.getText().trim()
        setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
        // setContent does not emit onUpdate by default, so manually notify
        // the parent so the proactive spell check fires on initial load
        if (text) onContentChange?.(text)
      }
    }, [mounted, editor]) // eslint-disable-line react-hooks/exhaustive-deps

    useImperativeHandle(ref, () => ({
      getBody: () => editor?.getText() ?? '',
      appendText: (text: string) => {
        if (!editor) return
        editor.chain().focus('end').insertContentAt(
          editor.state.doc.content.size,
          { type: 'paragraph', content: [{ type: 'text', text }] }
        ).run()
        localStorage.setItem(STORAGE_KEY_BODY, JSON.stringify(editor.getJSON()))
      },
      replaceWord: (original: string, corrected: string) => {
        if (!editor) return
        const { state, view } = editor
        const { doc } = state
        let found = false
        doc.descendants((node, pos) => {
          if (found || node.type.name !== 'text') return
          const idx = node.text?.indexOf(original) ?? -1
          if (idx === -1) return
          const from = pos + idx
          const to = from + original.length
          view.dispatch(state.tr.replaceWith(from, to, state.schema.text(corrected)))
          found = true
        })
        localStorage.setItem(STORAGE_KEY_BODY, JSON.stringify(editor.getJSON()))
      },
    }), [editor])

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value
      setTitle(val)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY_TITLE, val)
      }, DEBOUNCE_MS)
    }

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

        {/* TipTap editor */}
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />

        {/* Word count */}
        <div className="mt-4 text-right text-sm text-gray-400 select-none">
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </div>
    )
  }
)

export default WritingArea
