import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { getFilePath } from './storage'

export async function colorizeImage(filename: string): Promise<Buffer> {
  const filepath = getFilePath(filename)
  const inputBuffer = await readFile(filepath)

  // Mock colorization: apply a warm sepia-like tint
  // This simulates what a real AI colorization might produce
  const colorizedBuffer = await sharp(inputBuffer)
    // First convert to grayscale to ensure consistent starting point
    .grayscale()
    // Apply a warm tint using color manipulation
    .tint({ r: 240, g: 200, b: 160 })
    // Increase saturation slightly for a more colorful effect
    .modulate({
      saturation: 1.3,
      brightness: 1.05,
    })
    // Add slight warmth
    .gamma(1.1)
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
