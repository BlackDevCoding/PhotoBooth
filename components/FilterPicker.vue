<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
    <button
      v-for="f in filters"
      :key="f.key"
      type="button"
      class="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blueberry-400/70"
      :class="modelValue===f.key ? 'ring-2 ring-blueberry-400/70 bg-white/10' : ''"
      @click="$emit('update:modelValue', f.key)"
    >
      <div class="text-sm font-semibold">{{ f.name }}</div>
      <div class="text-xs text-white/60">{{ f.hint }}</div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { FILTERS, type FilterKey } from '~/composables/useFilters'

defineProps<{ modelValue: FilterKey }>()
defineEmits<{ (e: 'update:modelValue', v: FilterKey): void }>()
const filters = FILTERS
</script>
