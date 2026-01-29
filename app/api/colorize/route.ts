import { NextRequest, NextResponse } from 'next/server'
import { getPhoto, saveFile } from '@/lib/storage'
import { colorizeImage } from '@/lib/colorize'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photoId } = body

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    const photo = await getPhoto(photoId)
    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Apply colorization effect
    const colorizedBuffer = await colorizeImage(photo.filename)

    // Save the colorized image
    const colorizedPhoto = await saveFile(
      colorizedBuffer,
      `colorized-${photo.originalName}`,
      true,
      photo.id
    )

    return NextResponse.json({
      original: photo,
      colorized: colorizedPhoto,
    })
  } catch (error) {
    console.error('Colorization error:', error)
    return NextResponse.json(
      { error: 'Failed to colorize photo' },
      { status: 500 }
    )
  }
}
