import { createError, setHeader } from 'h3'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { photosDir } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const file = event.context.params?.file as string | undefined
  if (!file) throw createError({ statusCode: 404 })
  const safe = basename(file) // prevents traversal
  if (safe !== file) throw createError({ statusCode: 400, statusMessage: 'Bad filename' })

  const p = join(photosDir(config.storagePath), safe)
  try {
    const s = await stat(p)
    setHeader(event, 'content-length', String(s.size))
    setHeader(event, 'content-type', mimeFor(safe))
    return sendStream(event, createReadStream(p))
  } catch {
    throw createError({ statusCode: 404 })
  }
})

function mimeFor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}
