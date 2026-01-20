import nodemailer from 'nodemailer'
import { loadDb, saveDb } from '../utils/storage'
import { randomToken, sha256Hex } from '../utils/crypto'

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const storagePath = config.storagePath

  let timer: NodeJS.Timeout | null = null

  const generateAndSend = async () => {
    const token = randomToken(18)
    const hash = sha256Hex(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    const db = await loadDb(storagePath)
    db.admin.tokenHash = hash
    db.admin.tokenExpiresAt = expiresAt.toISOString()
    await saveDb(storagePath, db)

    await deliverToken({
      token,
      expiresAt: expiresAt.toISOString(),
      baseUrl: config.baseUrl,
      adminEmail: config.adminEmail,
      smtp: {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        pass: config.smtpPass
      },
      webhookUrl: config.adminWebhookUrl
    })

    if (process.dev) {
      console.log(`[Blue's PhotoBooth] Admin token (dev): ${token} (expires ${expiresAt.toISOString()})`)
    }
  }

  // run immediately on start
  generateAndSend().catch((e) => {
    console.error('[Blue\'s PhotoBooth] Failed to generate admin token', e)
  })

  // then hourly
  timer = setInterval(() => {
    generateAndSend().catch((e) => console.error('[Blue\'s PhotoBooth] Token rotation failed', e))
  }, 60 * 60 * 1000)

  nitroApp.hooks.hook('close', () => {
    if (timer) clearInterval(timer)
  })
})

async function deliverToken(opts: {
  token: string
  expiresAt: string
  baseUrl: string
  adminEmail: string
  smtp: { host: string; port: number; user: string; pass: string }
  webhookUrl: string
}) {
  const payload = {
    token: opts.token,
    expiresAt: opts.expiresAt,
    loginUrl: `${opts.baseUrl.replace(/\/$/, '')}/admin`
  }

  // webhook (optional)
  if (opts.webhookUrl) {
    try {
      await $fetch(opts.webhookUrl, { method: 'POST', body: payload })
    } catch (e) {
      console.error('[Blue\'s PhotoBooth] Webhook delivery failed', e)
    }
  }

  // email via SMTP (optional)
  if (opts.adminEmail && opts.smtp.host && opts.smtp.user && opts.smtp.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: opts.smtp.host,
        port: opts.smtp.port,
        secure: opts.smtp.port === 465,
        auth: { user: opts.smtp.user, pass: opts.smtp.pass }
      })

      await transporter.sendMail({
        from: `Blue's PhotoBooth <${opts.smtp.user}>`,
        to: opts.adminEmail,
        subject: "Blue's PhotoBooth Admin Token",
        text:
          `Your admin token is:\n\n${opts.token}\n\nExpires: ${opts.expiresAt}\n\nLogin: ${payload.loginUrl}\n`
      })
    } catch (e) {
      console.error('[Blue\'s PhotoBooth] Email delivery failed', e)
    }
  }
}
