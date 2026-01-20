import { createError } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { loadDb, saveDb, photosDir } from '../../utils/storage'
import { requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireAdmin(event, config.sessionSecret)

  const id = event.context.params?.id as string | undefined
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = await loadDb(config.storagePath)
  const idx = db.photos.findIndex((p) => p.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const rec = db.photos[idx]
  db.photos.splice(idx, 1)
  await saveDb(config.storagePath, db)

  // best-effort file removal
  const dir = photosDir(config.storagePath)
  await safeUnlink(join(dir, rec.filename))
  if (rec.originalFilename) await safeUnlink(join(dir, rec.originalFilename))

  return { ok: true }
})

async function safeUnlink(p: string) {
  try { await fs.unlink(p) } catch {}
}
