import { readBody, createError } from 'h3'
import { loadDb, saveDb, type SlideshowSettings } from '../../utils/storage'
import { requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireAdmin(event, config.sessionSecret)
  const body = await readBody<Partial<SlideshowSettings>>(event)
  const intervalMs = Math.min(30000, Math.max(2000, Number(body.intervalMs || 6000)))
  const showOverlays = Boolean(body.showOverlays)
  const showQr = Boolean(body.showQr)
  const db = await loadDb(config.storagePath)
  db.slideshow = { intervalMs, showOverlays, showQr }
  await saveDb(config.storagePath, db)
  return db.slideshow
})
