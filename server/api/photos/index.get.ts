import { loadDb } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const db = await loadDb(config.storagePath)

  const q = getQuery(event)
  const page = Math.max(1, Number(q.page || 1))
  const limit = Math.min(100, Math.max(1, Number(q.limit || 48)))
  const since = q.since ? Number(q.since) : null

  let items = db.photos.slice().sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  if (since) items = items.filter((p) => Date.parse(p.createdAt) > since)

  const total = items.length
  const start = (page - 1) * limit
  const pageItems = items.slice(start, start + limit)
  const nextCursor = pageItems.length ? Date.parse(pageItems[0].createdAt) : undefined

  return { items: pageItems, page, limit, total, nextCursor }
})
