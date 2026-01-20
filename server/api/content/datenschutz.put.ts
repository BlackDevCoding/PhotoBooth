import { readBody } from 'h3'
import { loadDb, saveDb } from '../../utils/storage'
import { requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  requireAdmin(event, config.sessionSecret)
  const body = await readBody<{ markdown?: string }>(event)
  const md = (body.markdown || '').toString()
  const db = await loadDb(config.storagePath)
  db.content.datenschutz = md
  await saveDb(config.storagePath, db)
  return { ok: true }
})
