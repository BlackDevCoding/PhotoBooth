export type PhotoMeta = {
  id: string
  filename: string
  url: string
  createdAt: string
  filter: string
  mode: 'single' | 'strip'
  width: number
  height: number
  size: number
  originalUrl?: string
}

export type SlideshowSettings = {
  intervalMs: number
  showOverlays: boolean
  showQr: boolean
}

export function useApi() {
  const listPhotos = (params: { page?: number; limit?: number; since?: number } = {}) =>
    $fetch<{ items: PhotoMeta[]; page: number; limit: number; total: number; nextCursor?: number }>(
      '/api/photos',
      { params }
    )

  const deletePhoto = (id: string) => $fetch(`/api/photos/${id}`, { method: 'DELETE' })
  const deleteAllPhotos = () => $fetch('/api/photos', { method: 'DELETE' })

  const getImpressum = () => $fetch<{ markdown: string }>('/api/content/impressum')
  const putImpressum = (markdown: string) =>
    $fetch('/api/content/impressum', { method: 'PUT', body: { markdown } })

  const getDatenschutz = () => $fetch<{ markdown: string }>('/api/content/datenschutz')
  const putDatenschutz = (markdown: string) =>
    $fetch('/api/content/datenschutz', { method: 'PUT', body: { markdown } })

  const getSlideshowSettings = () => $fetch<SlideshowSettings>('/api/settings/slideshow')
  const putSlideshowSettings = (settings: SlideshowSettings) =>
    $fetch('/api/settings/slideshow', { method: 'PUT', body: settings })

  const adminMe = () => $fetch<{ ok: boolean; expiresAt?: string }>('/api/admin/me')
  const adminLogin = (token: string) => $fetch('/api/admin/login', { method: 'POST', body: { token } })
  const adminLogout = () => $fetch('/api/admin/logout', { method: 'POST' })

  const getStatus = () => $fetch<{ photos: number; bytes: number; storagePath: string }>('/api/admin/status')

  return {
    listPhotos,
    deletePhoto,
    deleteAllPhotos,
    getImpressum,
    putImpressum,
    getDatenschutz,
    putDatenschutz,
    getSlideshowSettings,
    putSlideshowSettings,
    adminMe,
    adminLogin,
    adminLogout,
    getStatus
  }
}
