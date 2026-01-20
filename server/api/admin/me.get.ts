import { readAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const s = readAdminSession(event, config.sessionSecret)
  if (!s) return { ok: false }
  return { ok: true, expiresAt: s.expiresAt }
})
