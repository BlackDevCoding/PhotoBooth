<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    <figure v-for="p in photos" :key="p.id" class="group rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
      <div class="aspect-square bg-black/20">
        <img :src="p.url" :alt="`Photo ${p.id}`" class="h-full w-full object-cover" loading="lazy" />
      </div>
      <figcaption class="p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold">{{ formatDate(p.createdAt) }}</div>
            <div class="text-xs text-white/60">{{ p.filter }} · {{ p.mode }}</div>
          </div>
          <button
            v-if="showActions"
            type="button"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            @click="$emit('delete', p)"
          >
            Delete
          </button>
        </div>
      </figcaption>
    </figure>
  </div>
</template>

<script setup lang="ts">
import type { PhotoMeta } from '~/composables/useApi'

defineProps<{ photos: PhotoMeta[]; showActions?: boolean }>()
defineEmits<{ (e: 'delete', p: PhotoMeta): void }>()

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>
