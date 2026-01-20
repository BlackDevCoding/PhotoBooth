import { getCookie, setCookie, deleteCookie, createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { verifySession, signSession } from './crypto'

const COOKIE = 'bp_admin'

export function setAdminSession(event: H3Event, secret: string, hours = 8) {
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  const token = signSession({ role: 'admin', expiresAt: expiresAt.toISOString() }, secret)
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  })
  return expiresAt.toISOString()
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}

export function readAdminSession(event: H3Event, secret: string) {
  const c = getCookie(event, COOKIE)
  if (!c) return null
  const p = verifySession(c, secret)
  if (!p || p.role !== 'admin') return null
  if (!p.expiresAt || Date.parse(p.expiresAt) < Date.now()) return null
  return p as { role: 'admin'; expiresAt: string }
}

export function requireAdmin(event: H3Event, secret: string) {
  const s = readAdminSession(event, secret)
  if (!s) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // basic CSRF mitigation: require same-origin for state-changing requests
  const m = event.method || 'GET'
  if (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS') {
    const origin = getHeader(event, 'origin')
    const host = getHeader(event, 'host')
    if (origin && host && !origin.includes(host)) {
      throw createError({ statusCode: 403, statusMessage: 'CSRF blocked' })
    }
  }
  return s
}
