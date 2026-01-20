import { ref } from 'vue'

export function useKiosk() {
  const kiosk = useState('kioskMode', () => false)
  const wakeLockSupported = ref(false)
  let wakeLock: any = null

  if (process.client) {
    wakeLockSupported.value = 'wakeLock' in navigator
  }

  async function enableWakeLock() {
    if (!process.client) return
    try {
      // @ts-expect-error experimental
      wakeLock = await navigator.wakeLock.request('screen')
    } catch {
      wakeLock = null
    }
  }

  async function toggleKiosk(val?: boolean) {
    kiosk.value = typeof val === 'boolean' ? val : !kiosk.value
    if (kiosk.value) await enableWakeLock()
    else wakeLock?.release?.()
  }

  return { kiosk, wakeLockSupported, toggleKiosk }
}
