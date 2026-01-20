<template>
  <div class="min-h-dvh bg-booth text-white">
    <header class="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">📸</span>
          <span class="tracking-tight">Blue's PhotoBooth</span>
        </NuxtLink>
        <nav class="flex items-center gap-2 text-sm">
          <NuxtLink to="/" class="rounded-xl px-3 py-2 hover:bg-white/10">Booth</NuxtLink>
          <NuxtLink to="/gallery" class="rounded-xl px-3 py-2 hover:bg-white/10">Gallery</NuxtLink>
          <NuxtLink to="/slideshow" class="rounded-xl px-3 py-2 hover:bg-white/10">Slideshow</NuxtLink>
          <NuxtLink to="/admin" class="rounded-xl px-3 py-2 hover:bg-white/10">Admin</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <slot />
    </main>
    <footer class="mx-auto w-full max-w-6xl px-4 pb-10 text-xs text-white/60">
      <div class="flex flex-wrap items-center gap-3">
        <NuxtLink to="/impressum" class="hover:text-white">Impressum</NuxtLink>
        <NuxtLink to="/datenschutz" class="hover:text-white">Datenschutzerklärung</NuxtLink>
        <span class="ml-auto">© {{ new Date().getFullYear() }} Blue's PhotoBooth</span>
      </div>
    </footer>
  </div>
</template>
