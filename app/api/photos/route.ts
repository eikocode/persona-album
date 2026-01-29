import { NextResponse } from 'next/server'
import { listPhotos } from '@/lib/storage'

export async function GET() {
  try {
    const photos = await listPhotos()
    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error listing photos:', error)
    return NextResponse.json(
      { error: 'Failed to list photos' },
      { status: 500 }
    )
  }
}
