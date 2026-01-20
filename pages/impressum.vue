<template>
  <article class="card p-4 sm:p-6">
    <h1 class="text-2xl font-extrabold tracking-tight mb-4">Impressum</h1>
    <p class="text-sm text-white/70 mb-6">
      Hinweis: Dieser Text ist eine <strong>Vorlage</strong> und ersetzt keine Rechtsberatung.
      Bitte prüfen und anpassen.
    </p>
    <div class="prose prose-invert max-w-none" v-html="html"></div>
  </article>
</template>

<script setup lang="ts">
import { miniMarkdown } from '~/utils/miniMarkdown'

const api = useApi()
const { markdown } = await api.getImpressum()
const html = computed(() => miniMarkdown(markdown))
</script>
