'use client'
import { useRef, useCallback } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

export function ImageNodeView({ node, deleteNode, updateAttributes }: NodeViewProps) {
  const width = (node.attrs.width as number | null) ?? null
  const imgRef = useRef<HTMLImageElement>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startX.current = e.clientX
    startWidth.current = imgRef.current?.offsetWidth ?? 400

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current
      const newWidth = Math.max(80, Math.min(688, startWidth.current + delta))
      updateAttributes({ width: Math.round(newWidth) })
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [updateAttributes])

  return (
    <NodeViewWrapper as="div" className="group relative my-4 inline-block" contentEditable={false}>
      <img
        ref={imgRef}
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ''}
        style={width ? { width, height: 'auto' } : undefined}
        className={`${width ? '' : 'max-w-full'} h-auto rounded-lg block`}
        draggable={false}
      />
      {/* Right-edge resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 bottom-0 w-4 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-end"
        title="Drag to resize"
      >
        <div className="w-1.5 h-10 bg-white border border-gray-400 rounded-full shadow-sm mr-0.5" />
      </div>
      {/* Delete button — shifted left to avoid overlap with resize handle */}
      <button
        onClick={deleteNode}
        title="Remove photo"
        className="absolute top-2 right-8 w-6 h-6 rounded-full bg-black/60 text-white
                   text-sm leading-none flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-opacity
                   hover:bg-red-600"
      >
        ×
      </button>
    </NodeViewWrapper>
  )
}
