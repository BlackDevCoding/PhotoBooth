<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section class="card p-4 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-extrabold tracking-tight">Blue's PhotoBooth</h1>
        <div class="flex items-center gap-2">
          <label class="inline-flex items-center gap-2 text-sm text-white/70">
            <input v-model="soundOn" type="checkbox" class="h-4 w-4" /> Sound
          </label>
          <button type="button" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="toggleKiosk()">
            {{ kiosk ? 'Kiosk: On' : 'Kiosk: Off' }}
          </button>
        </div>
      </div>

      <div class="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
        <div class="relative aspect-[3/4] sm:aspect-video">
          <video
            ref="videoRef"
            class="absolute inset-0 h-full w-full object-cover"
            autoplay
            playsinline
            muted
          />

          <div v-if="!ready" class="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <div class="text-lg font-semibold">Camera</div>
              <p class="mt-2 text-sm text-white/70">Allow camera access to start.</p>
              <button class="btn btn-primary mt-4" @click="startCamera">Enable Camera</button>
              <p v-if="error" class="mt-3 text-xs text-rose-200">{{ error }}</p>
            </div>
          </div>

          <div v-if="countdown > 0" class="absolute inset-0 grid place-items-center">
            <div class="rounded-3xl bg-black/50 px-10 py-8 text-7xl font-black">{{ countdown }}</div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button class="btn btn-secondary" :disabled="!ready || busy" @click="flipCamera">Flip</button>
        <div class="ml-auto flex items-center gap-2 text-sm">
          <span class="text-white/60">Mode</span>
          <button
            class="rounded-xl border border-white/10 px-3 py-2"
            :class="mode === 'single' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'"
            @click="mode = 'single'"
          >Single</button>
          <button
            class="rounded-xl border border-white/10 px-3 py-2"
            :class="mode === 'strip' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'"
            @click="mode = 'strip'"
          >Strip (4)</button>
        </div>
      </div>

      <div class="mt-4">
        <div class="text-sm font-semibold">Filter</div>
        <div class="mt-2">
          <FilterPicker v-model="filter" />
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button class="btn btn-primary" :disabled="!ready || busy" @click="startSequence">
          {{ mode === 'single' ? 'Start' : 'Start Strip' }}
        </button>
        <NuxtLink class="btn btn-secondary" to="/gallery">Open Gallery</NuxtLink>
      </div>

      <p class="mt-4 text-xs text-white/60">
        Tip: Press <span class="kbd">Space</span> to start. Press <span class="kbd">Esc</span> to cancel.
      </p>
    </section>

    <section class="card p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold">Preview</h2>
        <div v-if="previewUrl" class="flex items-center gap-2">
          <button class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="retake">Retake</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">Save</button>
        </div>
      </div>

      <div v-if="!previewUrl" class="mt-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
        Your photo preview will appear here.
      </div>

      <div v-else class="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
        <img :src="previewUrl" alt="Preview" class="w-full" />
      </div>

      <div v-if="saveResult" class="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div class="text-sm font-semibold">Saved!</div>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <a class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" :href="saveResult.url" target="_blank" rel="noreferrer">Open</a>
          <NuxtLink class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" to="/slideshow">Slideshow</NuxtLink>
        </div>
      </div>

      <div class="mt-6 text-xs text-white/60">
        Photos are stored on the server. Admin can delete them anytime.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import FilterPicker from '~/components/FilterPicker.vue'
import { applyFilter, type FilterKey } from '~/composables/useFilters'
import { useCamera } from '~/composables/useCamera'
import { useKiosk } from '~/composables/useKiosk'
import { useApi, type PhotoMeta } from '~/composables/useApi'

const { videoRef, ready, error, start, switchFacingMode, captureToCanvas } = useCamera()
const { kiosk, toggleKiosk } = useKiosk()
const api = useApi()

const soundOn = ref(true)
const filter = ref<FilterKey>('none')
const mode = ref<'single' | 'strip'>('single')
const facing = ref<'user' | 'environment'>('user')

const countdown = ref(0)
const busy = ref(false)
const saving = ref(false)
const previewUrl = ref<string | null>(null)
const previewBlob = ref<Blob | null>(null)
const saveResult = ref<PhotoMeta | null>(null)

async function startCamera() {
  await start({ video: { facingMode: facing.value }, audio: false })
}

async function flipCamera() {
  facing.value = facing.value === 'user' ? 'environment' : 'user'
  await switchFacingMode(facing.value)
}

function beep() {
  if (!soundOn.value || !process.client) return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.05
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close()
    }, 90)
  } catch {}
}

async function runCountdown(seconds = 3) {
  for (let i = seconds; i >= 1; i--) {
    countdown.value = i
    beep()
    await new Promise((r) => setTimeout(r, 900))
  }
  countdown.value = 0
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob failed'))), 'image/jpeg', 0.95)
  })
}

function composeStrip(canvases: HTMLCanvasElement[]) {
  const w = canvases[0].width
  const h = canvases[0].height
  const gap = Math.round(w * 0.03)
  const strip = document.createElement('canvas')
  strip.width = w
  strip.height = canvases.length * h + (canvases.length - 1) * gap + gap * 2
  const ctx = strip.getContext('2d')!
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, strip.width, strip.height)
  let y = gap
  for (const c of canvases) {
    ctx.drawImage(c, 0, y)
    y += h + gap
  }
  // small footer
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = `${Math.max(14, Math.round(w * 0.04))}px system-ui`
  ctx.fillText("Blue's PhotoBooth", gap, strip.height - gap)
  return strip
}

async function startSequence() {
  if (!ready.value || busy.value) return
  saveResult.value = null
  busy.value = true
  try {
    if (mode.value === 'single') {
      await runCountdown(3)
      const canvas = await captureToCanvas(1280, 1706)
      await applyFilter(canvas, filter.value)
      const blob = await canvasToBlob(canvas)
      setPreview(blob)
    } else {
      const shots: HTMLCanvasElement[] = []
      for (let i = 0; i < 4; i++) {
        await runCountdown(2)
        const c = await captureToCanvas(900, 1200)
        await applyFilter(c, filter.value)
        shots.push(c)
        await new Promise((r) => setTimeout(r, 250))
      }
      const strip = composeStrip(shots)
      const blob = await canvasToBlob(strip)
      setPreview(blob)
    }
  } finally {
    busy.value = false
  }
}

function setPreview(blob: Blob) {
  previewBlob.value = blob
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(blob)
}

function retake() {
  saveResult.value = null
  previewBlob.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

async function save() {
  if (!previewBlob.value || saving.value) return
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('file', new File([previewBlob.value], 'capture.jpg', { type: 'image/jpeg' }))
    fd.append('filter', filter.value)
    fd.append('mode', mode.value)
    const res = await $fetch<PhotoMeta>('/api/photos', { method: 'POST', body: fd })
    saveResult.value = res
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault()
      startSequence()
    }
    if (e.key === 'Escape') {
      countdown.value = 0
    }
  })
  startCamera()
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>
