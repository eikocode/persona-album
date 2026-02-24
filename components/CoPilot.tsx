'use client'

import { useEffect, useRef, useState } from 'react'
import { PhotoMetadata } from '@/lib/storage'

export interface CoPilotProps {
  photos: PhotoMetadata[]
  getCurrentText: () => string
  onInsertText: (text: string) => void
  onReplaceText: (original: string, corrected: string) => void
  proactiveTrigger?: string
}

interface Message {
  role: 'user' | 'model'
  content: string
  draftParagraph?: string
  isProactive?: boolean
  fix?: { original: string; corrected: string }
}

export default function CoPilot({ photos, getCurrentText, onInsertText, onReplaceText, proactiveTrigger }: CoPilotProps) {
  const [mode, setMode] = useState<'interview' | 'edit'>('interview')
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [proactiveChecking, setProactiveChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastAnalyzedText = useRef('')

  const started = messages.length > 0
  const hasTaggedPhotos = photos.some(
    p => p.tags && Object.values(p.tags).some(v => v)
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function runProactiveCheck(text: string) {
    setProactiveChecking(true)
    try {
      const apiHistory = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'proactive', history: apiHistory, currentText: text, photos }),
      })
      if (!response.ok) {
        setMessages(prev => [...prev, {
          role: 'model',
          content: 'Could not run spell check — tap to retry or keep writing.',
          isProactive: true,
        }])
        return
      }
      const data = await response.json()
      const issues: { original: string; corrected: string; message: string }[] = data.issues ?? []
      if (issues.length > 0) {
        setMessages(prev => [
          ...prev,
          ...issues.map(issue => ({
            role: 'model' as const,
            content: issue.message,
            isProactive: true,
            fix: { original: issue.original, corrected: issue.corrected },
          })),
        ])
      } else {
        setMessages(prev => [...prev, {
          role: 'model',
          content: 'No spelling issues found — looking good!',
          isProactive: true,
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'model',
        content: 'Could not run spell check — check your connection and keep writing.',
        isProactive: true,
      }])
    } finally {
      setProactiveChecking(false)
    }
  }

  useEffect(() => {
    if (!proactiveTrigger) return
    if (proactiveTrigger === lastAnalyzedText.current) return
    lastAnalyzedText.current = proactiveTrigger
    runProactiveCheck(proactiveTrigger)
  }, [proactiveTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  function switchMode(newMode: 'interview' | 'edit') {
    if (newMode === mode) return
    setMode(newMode)
    setMessages([])
    setError(null)
    setUserInput('')
  }

  async function sendMessage(userMessage: string, history: Message[]) {
    setIsLoading(true)
    setError(null)
    try {
      const apiHistory = history.map(m => ({ role: m.role, content: m.content }))
      const currentText = (mode === 'edit' || mode === 'interview') ? getCurrentText() : undefined

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, history: apiHistory, userMessage, photos, currentText }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Request failed')
      }

      const { aiMessage, draftParagraph } = await response.json()
      setMessages(prev => [...prev, { role: 'model', content: aiMessage, draftParagraph }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function handleStart() {
    let triggerMessage: string
    if (mode === 'interview') {
      const text = getCurrentText()
      triggerMessage = text.trim()
        ? `Please start the interview. I've already written some content — avoid repeating topics already covered.`
        : 'Please start the interview and ask me your first question.'
    } else {
      const text = getCurrentText()
      triggerMessage = text.trim()
        ? `Please review my writing and give me feedback:\n\n${text}`
        : 'I haven\'t written anything yet. Please encourage me to start and give me a prompt.'
    }
    sendMessage(triggerMessage, [])
  }

  function handleSend() {
    const text = userInput.trim()
    if (!text || isLoading) return
    setUserInput('')
    const newMsg: Message = { role: 'user', content: text }
    // Capture current messages for history before state update
    const history = messages
    setMessages(prev => [...prev, newMsg])
    sendMessage(text, history)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bio-border bg-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Co-pilot</span>
          {proactiveChecking && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Reviewing…
            </span>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-bio-border">
          <button
            onClick={() => switchMode('interview')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'interview'
                ? 'bg-bio-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Interview
          </button>
          <button
            onClick={() => switchMode('edit')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-bio-border ${
              mode === 'edit'
                ? 'bg-bio-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Context notice — interview mode, no tagged photos */}
      {mode === 'interview' && !hasTaggedPhotos && (
        <div className="mx-3 mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg shrink-0">
          Tag your photos so I can ask you about them
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Empty state — shown before conversation starts */}
        {!started && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="w-10 h-10 rounded-full bg-bio-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-bio-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {mode === 'interview' ? 'Life Story Interview' : 'Writing Editor'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {mode === 'interview'
                  ? "I'll ask you questions about your life and help you write your story."
                  : "Paste or write your draft and I'll give you feedback and suggestions."}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isProactive ? (
              <div className="max-w-[90%] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-900">
                <span className="mr-1">💡</span>{msg.content}
                {msg.fix && (
                  <button
                    onClick={() => onReplaceText(msg.fix!.original, msg.fix!.corrected)}
                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700
                               text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Fix: &ldquo;{msg.fix.original}&rdquo; → &ldquo;{msg.fix.corrected}&rdquo;
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-bio-primary text-white rounded-tr-sm'
                    : 'bg-white border border-bio-border text-gray-800 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.draftParagraph && (
                  <button
                    onClick={() => onInsertText(msg.draftParagraph!)}
                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700
                               text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Insert into story
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-bio-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-1 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-3 py-3 border-t border-bio-border bg-white">
        {!started ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4
                       bg-bio-primary text-white text-sm font-medium rounded-lg
                       hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting…
              </>
            ) : mode === 'interview' ? (
              'Start Interview'
            ) : (
              'Check My Writing'
            )}
          </button>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={2}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-bio-border rounded-lg text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-bio-primary focus:border-transparent
                         resize-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !userInput.trim()}
              className="flex items-center justify-center w-10 h-10 bg-bio-primary text-white
                         rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
