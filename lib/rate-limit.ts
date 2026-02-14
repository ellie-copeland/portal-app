import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number  // time window in ms
  max: number       // max requests per window
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, max: 10 },     // 10 attempts / 15 min
  api: { windowMs: 60 * 1000, max: 60 },            // 60 req / min
  llm: { windowMs: 60 * 1000, max: 20 },            // 20 LLM calls / min
}

export function rateLimit(
  identifier: string,
  preset: keyof typeof DEFAULTS = 'api',
  config?: Partial<RateLimitConfig>
): NextResponse | null {
  const cfg = { ...DEFAULTS[preset], ...config }
  const now = Date.now()
  const key = `${preset}:${identifier}`

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + cfg.windowMs })
    return null
  }

  entry.count++
  if (entry.count > cfg.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  return null
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}
