import { promises as fs } from 'node:fs'
import { loadDb, photosDir } from '../../utils/storage'
import { requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireAdmin(event, config.sessionSecret)
  const db = await loadDb(config.storagePath)
  const dir = photosDir(config.storagePath)
  let bytes = 0
  try {
    const names = await fs.readdir(dir)
    for (const n of names) {
      try {
        const st = await fs.stat(`${dir}/${n}`)
        if (st.isFile()) bytes += st.size
      } catch {}
    }
  } catch {}

  return { photos: db.photos.length, bytes, storagePath: config.storagePath }
})
