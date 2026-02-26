'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { ImageNodeView } from './ImageNodeView'

export interface PageCanvasHandle {
  getText: () => string
  getJSON: () => object
  replaceWord: (original: string, corrected: string) => boolean
}

interface PageCanvasProps {
  content: object
  pageIndex: number
  pageNumber: number
  onUpdate: (pageIndex: number, json: object) => void
  onContentChange?: (text: string) => void
  onEditorReady?: (editor: Editor | null) => void
}

const PageCanvas = forwardRef<PageCanvasHandle, PageCanvasProps>(
  function PageCanvas({ content, pageIndex, pageNumber, onUpdate, onContentChange, onEditorReady }, ref) {
    // Store callbacks in refs so the TipTap closure never goes stale
    const onUpdateRef = useRef(onUpdate)
    const onContentChangeRef = useRef(onContentChange)
    useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])
    useEffect(() => { onContentChangeRef.current = onContentChange }, [onContentChange])

    const onEditorReadyRef = useRef(onEditorReady)
    useEffect(() => { onEditorReadyRef.current = onEditorReady }, [onEditorReady])

    const editor = useEditor({
      extensions: [
        StarterKit,
        ImageExtension.configure({ inline: false, allowBase64: false }).extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              width: {
                default: null,
                parseHTML: el => el.getAttribute('width') ? Number(el.getAttribute('width')) : null,
                renderHTML: attrs => attrs.width ? { width: attrs.width } : {},
              },
            }
          },
          addNodeView() {
            return ReactNodeViewRenderer(ImageNodeView)
          },
        }),
        Placeholder.configure({ placeholder: 'Start writing…' }),
      ],
      content,
      editorProps: {
        attributes: {
          class: 'writing-area focus:outline-none min-h-[400px]',
          spellcheck: 'true',
        },
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
        const json = editor.getJSON()
        onUpdateRef.current(pageIndex, json)
        onContentChangeRef.current?.(editor.getText())
      },
    })

    useEffect(() => {
      onEditorReadyRef.current?.(editor ?? null)
      return () => { onEditorReadyRef.current?.(null) }
    }, [editor])

    useImperativeHandle(ref, () => ({
      getText: () => editor?.getText() ?? '',
      getJSON: () => editor?.getJSON() ?? { type: 'doc', content: [{ type: 'paragraph' }] },
      replaceWord: (original: string, corrected: string): boolean => {
        if (!editor) return false
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
        return found
      },
    }), [editor])

    return (
      <div
        className="page-card bg-white shadow-lg relative"
        style={{ width: 816, height: 1056, flexShrink: 0, padding: '56px 64px' }}
      >
        <EditorContent editor={editor} />

        {/* Page number */}
        <span
          className="absolute bottom-6 right-10 text-xs text-gray-300 select-none"
        >
          {pageNumber}
        </span>
      </div>
    )
  }
)

export default PageCanvas
