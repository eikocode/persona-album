import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { getFilePath } from './storage'

export async function colorizeImage(filename: string): Promise<Buffer> {
  const filepath = getFilePath(filename)
  const inputBuffer = await readFile(filepath)

  // Mock colorization: apply a warm, vintage color effect
  // This creates a noticeable color transformation on B&W photos
  const colorizedBuffer = await sharp(inputBuffer)
    // Apply a warm tint (don't convert to grayscale - input is already B&W)
    .tint({ r: 255, g: 180, b: 120 })
    // Boost saturation significantly for visible color
    .modulate({
      saturation: 2.0,
      brightness: 1.1,
    })
    // Warm up the gamma
    .gamma(1.2, 1.0, 0.9)
    .toBuffer()

  return colorizedBuffer
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
