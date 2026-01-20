export default defineNuxtConfig({
  compatibilityDate: '2026-01-17',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: "Blue's PhotoBooth",
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#1d4ed8' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' }
      ]
    }
  },
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-change-me',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    storagePath: process.env.STORAGE_PATH || '.data',
    adminEmail: process.env.ADMIN_EMAIL || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    adminWebhookUrl: process.env.ADMIN_WEBHOOK_URL || '',
    public: {
      appName: "Blue's PhotoBooth"
    }
  },
  nitro: {
    routeRules: {
      '/photos/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
    }
  }
})
