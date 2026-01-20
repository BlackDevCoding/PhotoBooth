import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto'

export function sha256Hex(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export function randomToken(len = 24) {
  return randomBytes(len).toString('base64url')
}

export function signSession(payload: object, secret: string) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySession(token: string, secret: string) {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  if (!ok) return null
  try {
    const json = Buffer.from(body, 'base64url').toString('utf8')
    return JSON.parse(json) as any
  } catch {
    return null
  }
}
