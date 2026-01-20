import { clearAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  clearAdminSession(event)
  return { ok: true }
})
