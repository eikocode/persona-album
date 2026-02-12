import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

const BUCKET = 'photos'

export interface PhotoMetadata {
  id: string
  filename: string
  originalName: string
  url: string
  createdAt: string
  isColorized: boolean
  originalId?: string
}

interface PhotoRow {
  id: string
  filename: string
  original_name: string
  storage_path: string
  url: string
  is_colorized: boolean
  original_id: string | null
  created_at: string
}

function rowToMetadata(row: PhotoRow): PhotoMetadata {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    url: row.url,
    createdAt: row.created_at,
    isColorized: row.is_colorized,
    originalId: row.original_id ?? undefined,
  }
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  isColorized: boolean = false,
  originalId?: string
): Promise<PhotoMetadata> {
  const id = uuidv4()
  const ext = originalName.match(/\.[^.]+$/)?.[0] || '.jpg'
  const prefix = isColorized ? 'colorized-' : ''
  const filename = `${prefix}${id}${ext}`
  const storagePath = filename

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: getMimeType(ext),
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  const url = urlData.publicUrl

  // Insert metadata into Postgres
  const { data, error: dbError } = await supabase
    .from('photos')
    .insert({
      id,
      filename,
      original_name: originalName,
      mime_type: getMimeType(ext),
      size: buffer.length,
      storage_path: storagePath,
      url,
      is_colorized: isColorized,
      original_id: originalId ?? null,
    })
    .select()
    .single()

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error(`Database insert failed: ${dbError.message}`)
  }

  return rowToMetadata(data)
}

export async function listPhotos(): Promise<PhotoMetadata[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error listing photos:', error.message)
    return []
  }

  return (data ?? []).map(rowToMetadata)
}

export async function getPhoto(id: string): Promise<PhotoMetadata | null> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return rowToMetadata(data)
}

export async function deletePhoto(id: string): Promise<boolean> {
  // Get the photo to find its storage path
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError || !photo) {
    return false
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([photo.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError.message)
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', id)

  if (dbError) {
    console.error('Database delete error:', dbError.message)
    return false
  }

  return true
}

export async function getFileBuffer(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message ?? 'no data'}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function getMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    case '.gif': return 'image/gif'
    default: return 'image/jpeg'
  }
}
