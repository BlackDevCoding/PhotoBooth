import { loadDb } from '../../utils/storage'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const db = await loadDb(config.storagePath)
  return db.slideshow
})
