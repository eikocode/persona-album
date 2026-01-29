import { readdir, unlink, writeFile, stat } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

export interface PhotoMetadata {
  id: string
  filename: string
  originalName: string
  url: string
  createdAt: string
  isColorized: boolean
  originalId?: string
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  isColorized: boolean = false,
  originalId?: string
): Promise<PhotoMetadata> {
  const id = uuidv4()
  const ext = path.extname(originalName) || '.jpg'
  const prefix = isColorized ? 'colorized-' : ''
  const filename = `${prefix}${id}${ext}`
  const filepath = path.join(UPLOADS_DIR, filename)

  await writeFile(filepath, buffer)

  return {
    id,
    filename,
    originalName,
    url: `/uploads/${filename}`,
    createdAt: new Date().toISOString(),
    isColorized,
    originalId,
  }
}

export async function listPhotos(): Promise<PhotoMetadata[]> {
  try {
    const files = await readdir(UPLOADS_DIR)
    const photos: PhotoMetadata[] = []

    for (const filename of files) {
      if (filename === '.gitkeep') continue

      const ext = path.extname(filename).toLowerCase()
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) continue

      const filepath = path.join(UPLOADS_DIR, filename)
      const stats = await stat(filepath)

      const isColorized = filename.startsWith('colorized-')
      const idMatch = filename.match(/(?:colorized-)?([a-f0-9-]{36})/)
      const id = idMatch ? idMatch[1] : filename

      photos.push({
        id,
        filename,
        originalName: filename,
        url: `/uploads/${filename}`,
        createdAt: stats.mtime.toISOString(),
        isColorized,
      })
    }

    return photos.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export async function deletePhoto(id: string): Promise<boolean> {
  try {
    const files = await readdir(UPLOADS_DIR)
    const fileToDelete = files.find(f => f.includes(id))

    if (fileToDelete) {
      await unlink(path.join(UPLOADS_DIR, fileToDelete))
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function getPhoto(id: string): Promise<PhotoMetadata | null> {
  const photos = await listPhotos()
  return photos.find(p => p.id === id) || null
}

export function getFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename)
}
