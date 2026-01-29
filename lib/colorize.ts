import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { getFilePath } from './storage'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: {
          mimeType: string
          data: string
        }
      }>
    }
  }>
  error?: {
    message: string
  }
}

async function colorizeWithNanoBanana(imageBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) {
    console.log('No GEMINI_API_KEY found, using mock colorization')
    return null
  }

  const base64Image = imageBuffer.toString('base64')

  const requestBody = {
    contents: [{
      parts: [
        {
          text: 'Colorize this black and white photograph with realistic, natural colors. Add appropriate skin tones, hair colors, clothing colors, and environment colors based on the context of the image. Maintain the original composition and details while adding vibrant, lifelike colors that look historically accurate.'
        },
        {
          inlineData: {
            mimeType,
            data: base64Image
          }
        }
      ]
    }],
    generationConfig: {
      responseModalities: ['image', 'text'],
      imageSafety: 'block_low_and_above'
    }
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      return null
    }

    const data: GeminiResponse = await response.json()

    if (data.error) {
      console.error('Gemini API returned error:', data.error.message)
      return null
    }

    // Find the image part in the response
    const imagePart = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData)
    if (imagePart?.inlineData?.data) {
      return Buffer.from(imagePart.inlineData.data, 'base64')
    }

    console.error('No image found in Gemini response')
    return null
  } catch (error) {
    console.error('Failed to call Gemini API:', error)
    return null
  }
}

async function mockColorize(inputBuffer: Buffer): Promise<Buffer> {
  // Fallback: apply a warm, vintage color effect
  return sharp(inputBuffer)
    .tint({ r: 255, g: 180, b: 120 })
    .modulate({
      saturation: 2.0,
      brightness: 1.1,
    })
    .gamma(1.2, 1.0, 0.9)
    .toBuffer()
}

export async function colorizeImage(filename: string): Promise<Buffer> {
  const filepath = getFilePath(filename)
  const inputBuffer = await readFile(filepath)

  // Determine MIME type from extension
  const ext = filename.toLowerCase().split('.').pop()
  const mimeType = ext === 'png' ? 'image/png' :
                   ext === 'webp' ? 'image/webp' :
                   ext === 'gif' ? 'image/gif' : 'image/jpeg'

  // Try Nano Banana (Gemini) first, fall back to mock
  const nanoBananaResult = await colorizeWithNanoBanana(inputBuffer, mimeType)
  if (nanoBananaResult) {
    return nanoBananaResult
  }

  // Fallback to mock colorization
  return mockColorize(inputBuffer)
}

export async function applyVintageEffect(filename: string): Promise<Buffer> {
  const filepath = getFilePath(filename)
  const inputBuffer = await readFile(filepath)

  const vintageBuffer = await sharp(inputBuffer)
    .modulate({
      saturation: 0.8,
      brightness: 1.1,
    })
    .tint({ r: 255, g: 220, b: 180 })
    .gamma(0.9)
    .toBuffer()

  return vintageBuffer
}
