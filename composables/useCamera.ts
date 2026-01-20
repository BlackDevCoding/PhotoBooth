import { ref, onBeforeUnmount } from 'vue'

export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const ready = ref(false)
  const error = ref<string | null>(null)

  async function start(constraints: MediaStreamConstraints = { video: { facingMode: 'user' }, audio: false }) {
    error.value = null
    ready.value = false
    stop()
    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      stream.value = s
      if (videoRef.value) {
        videoRef.value.srcObject = s
        await videoRef.value.play()
        await waitForVideoReady(videoRef.value)
        ready.value = true
      }
    } catch (e: any) {
      error.value = e?.message || 'Camera permission denied or unavailable.'
      stop()
    }
  }

  function stop() {
    ready.value = false
    if (stream.value) {
      for (const t of stream.value.getTracks()) t.stop()
    }
    stream.value = null
  }

  async function switchFacingMode(facing: 'user' | 'environment') {
    await start({ video: { facingMode: facing }, audio: false })
  }

  async function captureToCanvas(targetW?: number, targetH?: number) {
    const v = videoRef.value
    if (!v) throw new Error('Video not mounted')
    await waitForVideoReady(v)

    const vw = v.videoWidth || 1280
    const vh = v.videoHeight || 720

    const canvas = document.createElement('canvas')
    const w = targetW || vw
    const h = targetH || vh
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas ctx')

    // Cover draw to keep stable aspect ratio
    const srcAR = vw / vh
    const dstAR = w / h
    let sx = 0, sy = 0, sw = vw, sh = vh
    if (srcAR > dstAR) {
      // video wider than target: crop left/right
      sw = Math.round(vh * dstAR)
      sx = Math.round((vw - sw) / 2)
    } else {
      // video taller than target: crop top/bottom
      sh = Math.round(vw / dstAR)
      sy = Math.round((vh - sh) / 2)
    }

    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, w, h)
    return canvas
  }

  onBeforeUnmount(stop)

  return { videoRef, stream, ready, error, start, stop, switchFacingMode, captureToCanvas }
}

async function waitForVideoReady(v: HTMLVideoElement) {
  if (v.readyState >= 2 && v.videoWidth > 0) return
  await new Promise<void>((resolve, reject) => {
    const to = window.setTimeout(() => reject(new Error('Video not ready')), 5000)
    const onCanPlay = () => {
      window.clearTimeout(to)
      v.removeEventListener('loadedmetadata', onCanPlay)
      v.removeEventListener('canplay', onCanPlay)
      resolve()
    }
    v.addEventListener('loadedmetadata', onCanPlay)
    v.addEventListener('canplay', onCanPlay)
  })
}
