import { createError, readMultipartFormData } from 'h3'
import { nanoid } from 'nanoid'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'
import sharp from 'sharp'
import { loadDb, saveDb, photosDir, type PhotoRecord } from '../../utils/storage'
import { rateLimit } from '../../utils/rateLimit'

const MAX_BYTES = 12 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export default defineEventHandler(async (event) => {
  rateLimit(event, { windowMs: 60_000, max: 30, keyPrefix: 'upload' })

  const config = useRuntimeConfig()
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'Expected multipart form data' })

  const file = form.find((p) => p.name === 'file')
  if (!file || !('data' in file)) throw createError({ statusCode: 400, statusMessage: 'Missing file' })

  const buf = file.data as Buffer
  if (buf.byteLength > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'File too large' })

  const ct = (file.type || '').toLowerCase()
  if (!ALLOWED.includes(ct)) throw createError({ statusCode: 415, statusMessage: 'Unsupported type' })

  const filter = String(form.find((p) => p.name === 'filter')?.data || 'none')
  const mode = (String(form.find((p) => p.name === 'mode')?.data || 'single') as 'single' | 'strip')
  const keepOriginal = String(form.find((p) => p.name === 'keepOriginal')?.data || '0') === '1'

  const id = nanoid(12)
  const outFile = `${id}.jpg`
  const outPath = join(photosDir(config.storagePath), outFile)

  const image = sharp(buf).rotate()
  const meta = await image.metadata()
  const width = meta.width || 0
  const height = meta.height || 0

  await image.jpeg({ quality: 92, mozjpeg: true }).toFile(outPath)
  const st = await fs.stat(outPath)

  let origFile: string | undefined
  if (keepOriginal) {
    origFile = `${id}_orig.${extFor(ct)}`
    await fs.writeFile(join(photosDir(config.storagePath), origFile), buf)
  }

  const record: PhotoRecord = {
    id,
    filename: outFile,
    url: `/photos/${encodeURIComponent(outFile)}`,
    createdAt: new Date().toISOString(),
    filter,
    mode,
    width,
    height,
    size: st.size,
    originalFilename: origFile,
    originalUrl: origFile ? `/photos/${encodeURIComponent(origFile)}` : undefined
  }

  const db = await loadDb(config.storagePath)
  db.photos.unshift(record)
  await saveDb(config.storagePath, db)

  return record
})

function extFor(ct: string) {
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  return 'jpg'
}
