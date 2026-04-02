import { nanoid } from 'nanoid'
import { db } from 'web/lib/supabase/db'
import Compressor from 'compressorjs'

const BUCKET = 'public-images'

export const uploadImage = async (
  username: string,
  file: File,
  prefix?: string,
  onProgress?: (progress: number, isRunning: boolean) => void
) => {
  // Replace filename with a nanoid to avoid collisions
  const [, ext] = file.name.split('.')
  const filename = `${nanoid(10)}.${ext}`
  const path = `user-images/${username}${prefix ? '/' + prefix : ''}/${filename}`

  if (file.size > 20 * 1024 ** 2) {
    return Promise.reject('File is over 20 MB')
  }

  // if >1MB compress
  if (file.size > 1024 ** 2) {
    file = await new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.6,
        maxHeight: 1920,
        maxWidth: 1920,
        convertSize: 1000000, // if result >1MB turn to jpeg
        success: (file: File) => resolve(file),
        error: (error) => reject(error.message),
      })
    })
  }

  // Signal upload start
  if (onProgress) onProgress(0, true)

  const { data, error } = await db.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) {
    throw error
  }

  // Signal upload complete
  if (onProgress) onProgress(1, false)

  const {
    data: { publicUrl },
  } = db.storage.from(BUCKET).getPublicUrl(data.path)

  return publicUrl
}
