import { readBody, createError } from 'h3'
import { loadDb } from '../../utils/storage'
import { sha256Hex } from '../../utils/crypto'
import { setAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ token?: string }>(event)
  const token = (body.token || '').toString().trim()
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Token required' })

  const db = await loadDb(config.storagePath)
  const exp = db.admin.tokenExpiresAt ? Date.parse(db.admin.tokenExpiresAt) : 0
  if (!db.admin.tokenHash || !exp || exp < Date.now()) {
    throw createError({ statusCode: 401, statusMessage: 'Token expired' })
  }
  const hash = sha256Hex(token)
  if (hash !== db.admin.tokenHash) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  const expiresAt = setAdminSession(event, config.sessionSecret, 8)
  return { ok: true, expiresAt }
})
