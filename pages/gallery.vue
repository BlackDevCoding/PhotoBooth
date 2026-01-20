<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">Gallery</h1>
        <p class="text-sm text-white/70">Saved photos on this booth.</p>
      </div>
      <NuxtLink to="/" class="btn btn-secondary">Back to Booth</NuxtLink>
    </div>

    <PhotoGrid :photos="photos" />

    <div class="flex justify-center">
      <button v-if="canLoad" class="btn btn-secondary" @click="loadMore">Load more</button>
      <div v-else class="text-sm text-white/60">No more photos.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PhotoGrid from '~/components/PhotoGrid.vue'
import { useApi, type PhotoMeta } from '~/composables/useApi'

const api = useApi()
const photos = ref<PhotoMeta[]>([])
const page = ref(1)
const limit = 24
const total = ref(0)

const canLoad = computed(() => photos.value.length < total.value)

async function load() {
  const res = await api.listPhotos({ page: page.value, limit })
  total.value = res.total
  photos.value.push(...res.items)
}

async function loadMore() {
  page.value += 1
  await load()
}

await load()
</script>
