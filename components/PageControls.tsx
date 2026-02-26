'use client'

interface PageControlsProps {
  afterIndex: number
  totalPages: number
  onAddPage: (afterIndex: number) => void
  onDeletePage: (index: number) => void
}

export default function PageControls({
  afterIndex,
  totalPages,
  onAddPage,
  onDeletePage,
}: PageControlsProps) {
  return (
    <div
      className="page-controls flex items-center justify-center gap-3"
      style={{ width: 816, flexShrink: 0 }}
    >
      <button
        onClick={() => onAddPage(afterIndex)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500
                   bg-white border border-gray-200 rounded-md hover:border-blue-400
                   hover:text-blue-600 transition-colors shadow-sm"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add page
      </button>

      {totalPages > 1 && (
        <button
          onClick={() => onDeletePage(afterIndex)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400
                     bg-white border border-gray-200 rounded-md hover:border-red-300
                     hover:text-red-500 transition-colors shadow-sm"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Delete page
        </button>
      )}
    </div>
  )
}
