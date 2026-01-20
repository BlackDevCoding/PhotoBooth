import type { H3Event } from 'h3'
import { getRequestIP, createError } from 'h3'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(event: H3Event, opts: { windowMs: number; max: number; keyPrefix?: string }) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const key = `${opts.keyPrefix || 'rl'}:${ip}`
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return
  }
  b.count += 1
  if (b.count > opts.max) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
}
