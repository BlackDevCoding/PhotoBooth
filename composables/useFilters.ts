export type FilterKey = 'none' | 'grayscale' | 'rainbow' | 'vintage' | 'highcontrast'

export const FILTERS: { key: FilterKey; name: string; hint: string }[] = [
  { key: 'none', name: 'Original', hint: 'No filter' },
  { key: 'grayscale', name: 'Grayscale', hint: 'Classic B/W' },
  { key: 'rainbow', name: 'Rainbow', hint: 'Fun overlay' },
  { key: 'vintage', name: 'Vintage', hint: 'Warm + fade' },
  { key: 'highcontrast', name: 'High Contrast', hint: 'Punchy' }
]

export async function applyFilter(canvas: HTMLCanvasElement, key: FilterKey) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas
  if (key === 'none') return

  if (key === 'grayscale') {
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = y
    }
    ctx.putImageData(img, 0, 0)
    return
  }

  // Faster pipeline: use globalCompositeOperation + filters where possible
  if (key === 'highcontrast') {
    ctx.save()
    // Draw onto itself with CSS filter-style adjustments
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const tctx = tmp.getContext('2d')!
    tctx.drawImage(canvas, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.filter = 'contrast(1.35) saturate(1.2)'
    ctx.drawImage(tmp, 0, 0)
    ctx.filter = 'none'
    ctx.restore()
    return
  }

  if (key === 'vintage') {
    ctx.save()
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const tctx = tmp.getContext('2d')!
    tctx.drawImage(canvas, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.filter = 'saturate(0.85) contrast(1.05) brightness(1.02) sepia(0.35)'
    ctx.drawImage(tmp, 0, 0)
    ctx.filter = 'none'
    // subtle vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.25)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // warm wash
    ctx.fillStyle = 'rgba(255, 210, 160, 0.08)'
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
    return
  }

  if (key === 'rainbow') {
    ctx.save()
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, 'rgba(255,0,0,0.18)')
    grad.addColorStop(0.2, 'rgba(255,165,0,0.18)')
    grad.addColorStop(0.4, 'rgba(255,255,0,0.14)')
    grad.addColorStop(0.6, 'rgba(0,255,0,0.14)')
    grad.addColorStop(0.8, 'rgba(0,128,255,0.16)')
    grad.addColorStop(1, 'rgba(180,0,255,0.18)')
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
    return
  }
}
