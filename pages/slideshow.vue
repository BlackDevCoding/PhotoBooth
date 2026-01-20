<template>
  <div class="relative">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">Slideshow</h1>
        <p class="text-sm text-white/70">Optimized for a second screen. Updates automatically.</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="toggleFullscreen">
          Fullscreen
        </button>
        <NuxtLink to="/" class="btn btn-secondary">Back</NuxtLink>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="relative aspect-[16/9] w-full bg-black">
        <Transition name="fade" mode="out-in">
          <img v-if="current" :key="current.id" :src="current.url" class="absolute inset-0 h-full w-full object-contain" alt="Slideshow photo" />
        </Transition>

        <div v-if="settings.showOverlays" class="absolute left-4 top-4 rounded-2xl bg-black/40 px-4 py-3 text-sm backdrop-blur">
          <div class="font-semibold">Blue's PhotoBooth</div>
          <div class="text-white/70">{{ current ? formatDate(current.createdAt) : 'Loading…' }}</div>
        </div>

        <div v-if="settings.showQr" class="absolute bottom-4 right-4 flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-3 backdrop-blur">
          <img v-if="qrDataUrl" :src="qrDataUrl" class="h-20 w-20 rounded-xl bg-white p-2" alt="QR code" />
          <div class="text-sm">
            <div class="font-semibold">Open Booth</div>
            <div class="text-white/70">{{ boothUrl }}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 p-4">
        <div class="flex items-center gap-2 text-sm text-white/70">
          <span>{{ photos.length }} loaded</span>
          <span class="text-white/30">•</span>
          <span>Interval {{ Math.round(settings.intervalMs / 1000) }}s</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="prev">Prev</button>
          <button class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="next">Next</button>
          <button class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="paused = !paused">
            {{ paused ? 'Play' : 'Pause' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import { useApi, type PhotoMeta, type SlideshowSettings } from '~/composables/useApi'

const api = useApi()
const config = useRuntimeConfig()

const photos = ref<PhotoMeta[]>([])
const settings = ref<SlideshowSettings>({ intervalMs: 7000, showOverlays: true, showQr: false })
const idx = ref(0)
const paused = ref(false)
const qrDataUrl = ref<string | null>(null)

const boothUrl = computed(() => config.public?.baseUrl || config.baseUrl || 'http://localhost:3000')
const current = computed(() => photos.value[idx.value] || null)

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

function next() {
  if (!photos.value.length) return
  idx.value = (idx.value + 1) % photos.value.length
}

function prev() {
  if (!photos.value.length) return
  idx.value = (idx.value - 1 + photos.value.length) % photos.value.length
}

async function loadInitial() {
  settings.value = await api.getSlideshowSettings()
  const res = await api.listPhotos({ page: 1, limit: 200 })
  photos.value = res.items
  idx.value = 0
  if (settings.value.showQr) {
    qrDataUrl.value = await QRCode.toDataURL(boothUrl.value, { margin: 1, width: 160 })
  }
}

async function pollNew() {
  // Pull newest page 1; keep bounded and de-dupe
  const res = await api.listPhotos({ page: 1, limit: 50 })
  const existing = new Set(photos.value.map(p => p.id))
  const incoming = res.items.filter(p => !existing.has(p.id))
  if (incoming.length) {
    photos.value = [...incoming, ...photos.value].slice(0, 2000)
    idx.value += incoming.length
  }
}

let t: any
let pollT: any

onMounted(async () => {
  await loadInitial()
  t = setInterval(() => { if (!paused.value) next() }, settings.value.intervalMs)
  pollT = setInterval(pollNew, 5000)
})

watch(() => settings.value.intervalMs, (ms) => {
  clearInterval(t)
  t = setInterval(() => { if (!paused.value) next() }, ms)
})

onBeforeUnmount(() => {
  clearInterval(t)
  clearInterval(pollT)
})

async function toggleFullscreen() {
  const el = document.documentElement
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.()
  } else {
    await document.exitFullscreen?.()
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 350ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
