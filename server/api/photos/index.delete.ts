import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { loadDb, saveDb, photosDir } from '../../utils/storage'
import { requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireAdmin(event, config.sessionSecret)

  const db = await loadDb(config.storagePath)
  const dir = photosDir(config.storagePath)

  // delete files best-effort
  for (const p of db.photos) {
    await fs.rm(join(dir, p.filename), { force: true })
    if (p.originalFilename) await fs.rm(join(dir, p.originalFilename), { force: true })
  }

  db.photos = []
  await saveDb(config.storagePath, db)
  return { ok: true }
})
