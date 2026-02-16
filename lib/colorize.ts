import sharp from 'sharp'
import { getFileBuffer } from './storage'
import Replicate from 'replicate'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash-image'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
const replicate = REPLICATE_API_TOKEN ? new Replicate({ auth: REPLICATE_API_TOKEN }) : null

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

async function colorizeWithReplicate(imageBuffer: Buffer, mimeType: string): Promise<Buffer | null> {
  if (!replicate) {
    console.log('No REPLICATE_API_TOKEN found')
    return null
  }

  try {
    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`

    console.log('Calling Replicate nano-banana-pro for colorization...')

    // Using DeOldify - THE dedicated colorization model!
    const output: any = await replicate.run(
      'arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950',
      {
        input: {
          input_image: base64Image,  // Correct parameter name!
          model_name: 'Artistic',    // Artistic or Stable
          render_factor: 35          // Quality: 7-45, higher = better
        }
      }
    )

    console.log('Replicate nano-banana-pro output received')

    // Handle string output (URL)
    if (typeof output === 'string') {
      if ((output as string).startsWith('http')) {
        console.log('Fetching colorized image from URL:', output)
        const response = await fetch(output)
        if (!response.ok) {
          console.error('Failed to fetch colorized image from Replicate')
          return null
        }
        const arrayBuffer = await response.arrayBuffer()
        console.log('✅ Successfully colorized!')
        return Buffer.from(arrayBuffer)
      }
    }

    // Handle object output (FileOutput with .url() method)
    if (output && typeof output === 'object') {
      const outputObj = output as any

      // Check if it has a .url() method
      if (typeof outputObj.url === 'function') {
        const imageUrl = outputObj.url()
        const imageUrlString = imageUrl.toString() // Convert URL object to string
        console.log('Fetching colorized image from:', imageUrlString)
        const response = await fetch(imageUrlString)
        if (!response.ok) {
          console.error('Failed to fetch colorized image from Replicate')
          return null
        }
        const arrayBuffer = await response.arrayBuffer()
        console.log('✅ Successfully colorized!')
        return Buffer.from(arrayBuffer)
      }

      // Fallback: check if output is directly a buffer-like object
      if (Buffer.isBuffer(output)) {
        console.log('✅ Got buffer directly!')
        return output
      }
    }

    console.error('Unexpected output format:', typeof output)
    return null
  } catch (error) {
    console.error('Failed to call Replicate nano-banana-pro:', error)
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
    .gamma(1.1)
    .toBuffer()
}

export async function colorizeImage(filename: string): Promise<Buffer> {
  const inputBuffer = await getFileBuffer(filename)

  // Determine MIME type from extension
  const ext = filename.toLowerCase().split('.').pop()
  const mimeType = ext === 'png' ? 'image/png' :
                   ext === 'webp' ? 'image/webp' :
                   ext === 'gif' ? 'image/gif' : 'image/jpeg'

  // Try Replicate first (has free tier and great quality!)
  console.log('Attempting Replicate colorization...')
  const replicateResult = await colorizeWithReplicate(inputBuffer, mimeType)
  if (replicateResult) {
    console.log('✅ Replicate colorization successful!')
    return replicateResult
  }

  // Try Nano Banana (Gemini) as fallback
  console.log('Attempting Gemini colorization...')
  const nanoBananaResult = await colorizeWithNanoBanana(inputBuffer, mimeType)
  if (nanoBananaResult) {
    console.log('✅ Gemini colorization successful!')
    return nanoBananaResult
  }

  // Final fallback to mock colorization
  console.log('⚠️  Using mock colorization (no API keys available)')
  return mockColorize(inputBuffer)
}

export async function applyVintageEffect(filename: string): Promise<Buffer> {
  const inputBuffer = await getFileBuffer(filename)

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
