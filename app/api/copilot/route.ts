import { NextRequest, NextResponse } from 'next/server'
import { PhotoMetadata } from '@/lib/storage'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

interface Message {
  role: 'user' | 'model'
  content: string
}

interface CopilotRequest {
  mode: 'interview' | 'edit' | 'proactive'
  history: Message[]
  userMessage?: string
  photos: PhotoMetadata[]
  currentText?: string
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function buildPhotoContext(photos: PhotoMetadata[]): string {
  const tagged = photos.filter(
    p => p.tags && Object.values(p.tags).some(v => v)
  )
  if (tagged.length === 0) return 'The user has not tagged any photos yet.'

  return tagged
    .map((p, i) => {
      const t = p.tags!
      const parts: string[] = []
      if (t.people) parts.push(`People: ${t.people}`)
      if (t.location) parts.push(`Location: ${t.location}`)
      if (t.event) parts.push(`Event: ${t.event}`)
      if (t.date) parts.push(`Date: ${t.date}`)
      if (t.caption) parts.push(`Caption: ${t.caption}`)
      return `Photo ${i + 1}: ${parts.join(' | ')}`
    })
    .join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body: CopilotRequest = await request.json()
    const { mode, history, userMessage, photos, currentText } = body

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const photoContext = buildPhotoContext(photos)
    const hasTaggedPhotos = photoContext !== 'The user has not tagged any photos yet.'

    let systemPrompt: string

    if (mode === 'interview') {
      systemPrompt = `You are a warm, encouraging life story co-pilot helping someone write their personal biography. Your job is to guide them through their life story using thoughtful, one-at-a-time questions.

Here are the photos the user has tagged with context:
${photoContext}

${
  !hasTaggedPhotos
    ? 'Note: The user has not tagged any photos yet. Gently remind them that tagging their photos will help you ask more specific questions about the people, places, and events in those photos. Then still ask them one open-ended question to get them started writing.'
    : 'Use these photos as context for your questions, asking about the people, places, and events shown.'
}
${currentText ? `\nThe user has already written the following text — do NOT ask about topics already covered here. Instead, pick up the story where the writing leaves off or explore angles not yet addressed:\n\n${currentText}\n` : ''}
Guidelines:
- Ask only ONE question at a time
- Be warm, encouraging, and curious
- When the user shares a meaningful memory or story, write a polished paragraph capturing it in first-person and wrap it in <draft>...</draft> tags
- After providing a draft, ask a follow-up question to continue the story
- Keep drafts personal and in first-person perspective`
    } else if (mode === 'proactive') {
      systemPrompt = `You are a careful writing assistant silently monitoring a biography being written.
Scan the entire text and find ALL spelling errors and clear grammar mistakes.

Respond with a JSON object with one field:
- "issues": an array of objects, each with:
  - "original": the EXACT text as it appears (copy it character-for-character from the text)
  - "corrected": the corrected replacement (must be DIFFERENT from original)
  - "message": a short warm sentence

Rules:
- For misspelled words: original = the misspelled word, corrected = correct spelling
- For article errors (a/an): original = the full phrase e.g. "a apple", corrected = "an apple"
- NEVER include an issue where original and corrected are identical
- Only flag issues you are certain about
- If no issues exist, return {"issues":[]}

Examples of good output:
{"issues":[
  {"original":"gradma","corrected":"grandma","message":"Small typo — easy fix!"},
  {"original":"siter","corrected":"sister","message":"Another small typo here!"},
  {"original":"a immigrant","corrected":"an immigrant","message":"Article tweak needed."}
]}`
    } else {
      systemPrompt = `You are a careful, respectful editor helping someone polish their life story writing. Your role is to suggest improvements without rewriting the author's voice.

Guidelines:
- Point out specific spelling and grammar issues with examples
- Suggest ways to improve clarity and flow
- Never completely rewrite passages — preserve the author's unique voice
- Be encouraging and specific in your feedback
- If the text is empty or very short, encourage them to start writing and offer a helpful prompt`
    }

    // Build OpenAI messages array
    const messages: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }]

    // Add conversation history (map 'model' → 'assistant')
    for (const msg of history) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content,
      })
    }

    // Add current user message
    if (mode === 'proactive') {
      if (currentText) {
        messages.push({ role: 'user', content: `Please review this text:\n\n${currentText}` })
      }
    } else if (userMessage) {
      messages.push({ role: 'user', content: userMessage })
    }

    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.8,
        max_tokens: 1024,
        ...(mode === 'proactive' ? { response_format: { type: 'json_object' } } : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content ?? ''

    // Proactive mode: parse JSON array of issues
    if (mode === 'proactive') {
      try {
        const parsed = JSON.parse(rawText)
        const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : []
        const issues = rawIssues.filter(
          (i: { original?: string; corrected?: string; message?: string }) =>
            i.original && i.corrected && i.message && i.original !== i.corrected
        )
        return NextResponse.json({ issues })
      } catch {
        return NextResponse.json({ issues: [] })
      }
    }

    // Extract <draft>...</draft> block
    const draftMatch = rawText.match(/<draft>([\s\S]*?)<\/draft>/)
    let draftParagraph: string | undefined
    let aiMessage = rawText

    if (draftMatch) {
      draftParagraph = draftMatch[1].trim()
      aiMessage = rawText.replace(/<draft>[\s\S]*?<\/draft>/, '').trim()
    }

    return NextResponse.json({ aiMessage, draftParagraph })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
