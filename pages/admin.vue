<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">Admin</h1>
        <p class="text-sm text-white/70">Login with the hourly token (sent via email or webhook).</p>
      </div>
      <NuxtLink to="/" class="btn btn-secondary">Back to Booth</NuxtLink>
    </div>

    <section v-if="!loggedIn" class="card p-4 sm:p-6 space-y-4">
      <div class="max-w-md space-y-2">
        <label class="block text-sm font-medium">Token</label>
        <input v-model="token" class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30" placeholder="Enter token" autocomplete="one-time-code" />
        <div class="flex items-center gap-2">
          <button class="btn btn-primary" :disabled="loading || token.trim().length < 6" @click="login">
            {{ loading ? 'Signing in…' : 'Login' }}
          </button>
          <span v-if="err" class="text-sm text-rose-200">{{ err }}</span>
        </div>
        <p class="text-xs text-white/60">
          Dev note: if SMTP/webhook not configured, token is logged in server console on start.
        </p>
      </div>
    </section>

    <section v-else class="card p-4 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-white/70">
          Session active <span v-if="me?.expiresAt">until {{ new Date(me.expiresAt).toLocaleString() }}</span>.
        </div>
        <button class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" @click="logout">
          Logout
        </button>
      </div>

      <div class="mt-6 border-t border-white/10 pt-6">
        <div class="flex flex-wrap gap-2">
          <button v-for="t in tabs" :key="t" class="rounded-xl px-3 py-2 text-sm"
            :class="tab===t ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'"
            @click="tab=t"
          >{{ t }}</button>
        </div>

        <div class="mt-6">
          <div v-if="tab==='Photos'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold">Manage photos</h2>
              <button class="btn btn-danger" @click="confirmDeleteAll">Delete ALL</button>
            </div>
            <PhotoGrid :photos="photos" show-actions @delete="confirmDeleteOne" />
            <div class="flex justify-center" v-if="hasMore">
              <button class="btn btn-secondary" @click="loadMore">Load more</button>
            </div>
          </div>

          <div v-else-if="tab==='Content'" class="grid gap-6 lg:grid-cols-2">
            <div class="space-y-2">
              <h2 class="text-lg font-bold">Impressum (template)</h2>
              <textarea v-model="impressum" class="h-[360px] w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm" />
              <button class="btn btn-primary" @click="saveImpressum">Save Impressum</button>
            </div>
            <div class="space-y-2">
              <h2 class="text-lg font-bold">Datenschutzerklärung (template)</h2>
              <textarea v-model="datenschutz" class="h-[360px] w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm" />
              <button class="btn btn-primary" @click="saveDatenschutz">Save Datenschutz</button>
            </div>
          </div>

          <div v-else-if="tab==='Slideshow'" class="space-y-4 max-w-xl">
            <h2 class="text-lg font-bold">Slideshow settings</h2>
            <label class="block text-sm">Interval (seconds)</label>
            <input type="number" min="3" max="60" v-model.number="intervalSeconds" class="w-40 rounded-2xl border border-white/10 bg-black/30 px-3 py-2" />
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="showOverlays" /> Show overlays</label>
              <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="showQr" /> Show QR</label>
            </div>
            <button class="btn btn-primary" @click="saveSlideshow">Save settings</button>
          </div>

          <div v-else class="space-y-3">
            <h2 class="text-lg font-bold">System status</h2>
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div class="text-xs text-white/60">Photos</div>
                <div class="text-2xl font-extrabold">{{ status?.photos ?? '—' }}</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div class="text-xs text-white/60">Storage used</div>
                <div class="text-2xl font-extrabold">{{ bytes(status?.bytes || 0) }}</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div class="text-xs text-white/60">Storage path</div>
                <div class="truncate text-sm font-semibold">{{ status?.storagePath ?? '—' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="confirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1220] p-5">
        <div class="text-lg font-bold">Confirm</div>
        <p class="mt-2 text-sm text-white/70">{{ confirm.message }}</p>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn btn-secondary" @click="confirm=null">Cancel</button>
          <button class="btn btn-danger" @click="confirm.ok">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PhotoMeta } from '~/composables/useApi'

const api = useApi()
const token = ref('')
const loading = ref(false)
const err = ref('')
const loggedIn = ref(false)
const me = ref<{ ok: boolean; expiresAt?: string } | null>(null)

const tabs = ['Photos', 'Content', 'Slideshow', 'Status'] as const
const tab = ref<(typeof tabs)[number]>('Photos')

const photos = ref<PhotoMeta[]>([])
const page = ref(1)
const limit = 24
const hasMore = ref(true)

const impressum = ref('')
const datenschutz = ref('')

const intervalSeconds = ref(8)
const showOverlays = ref(true)
const showQr = ref(false)

const status = ref<{ photos: number; bytes: number; storagePath: string } | null>(null)

const confirm = ref<null | { message: string; ok: () => Promise<void> | void }>(null)

function bytes(n: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

async function refreshMe() {
  try {
    me.value = await api.adminMe()
    loggedIn.value = !!me.value?.ok
  } catch {
    loggedIn.value = false
  }
}

async function login() {
  err.value = ''
  loading.value = true
  try {
    await api.adminLogin(token.value.trim())
    token.value = ''
    await refreshMe()
    await loadAll()
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

async function logout() {
  await api.adminLogout()
  loggedIn.value = false
  me.value = null
}

async function loadPhotos(reset = false) {
  if (reset) {
    page.value = 1
    photos.value = []
    hasMore.value = true
  }
  if (!hasMore.value) return
  const res = await api.listPhotos({ page: page.value, limit })
  photos.value.push(...res.items)
  hasMore.value = photos.value.length < res.total
}

async function loadContent() {
  const i = await api.getImpressum()
  const d = await api.getDatenschutz()
  impressum.value = i.markdown
  datenschutz.value = d.markdown
}

async function loadSlideshow() {
  const s = await api.getSlideshowSettings()
  intervalSeconds.value = Math.round(s.intervalMs / 1000)
  showOverlays.value = s.showOverlays
  showQr.value = s.showQr
}

async function loadStatus() {
  status.value = await api.getStatus()
}

async function loadAll() {
  await Promise.all([loadPhotos(true), loadContent(), loadSlideshow(), loadStatus()])
}

async function loadMore() {
  page.value += 1
  await loadPhotos()
}

async function saveImpressum() {
  await api.putImpressum(impressum.value)
}
async function saveDatenschutz() {
  await api.putDatenschutz(datenschutz.value)
}
async function saveSlideshow() {
  await api.putSlideshowSettings({
    intervalMs: Math.max(3000, intervalSeconds.value * 1000),
    showOverlays: showOverlays.value,
    showQr: showQr.value
  })
}

function confirmDeleteOne(p: PhotoMeta) {
  confirm.value = {
    message: 'Delete this photo permanently?',
    ok: async () => {
      await api.deletePhoto(p.id)
      photos.value = photos.value.filter(x => x.id !== p.id)
      await loadStatus()
      confirm.value = null
    }
  }
}
function confirmDeleteAll() {
  confirm.value = {
    message: 'Delete ALL photos permanently? This cannot be undone.',
    ok: async () => {
      await api.deleteAllPhotos()
      photos.value = []
      hasMore.value = false
      await loadStatus()
      confirm.value = null
    }
  }
}

await refreshMe()
if (loggedIn.value) await loadAll()
</script>
