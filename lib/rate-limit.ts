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
  _identifier: string,
  _preset: keyof typeof DEFAULTS = 'api',
  _config?: Partial<RateLimitConfig>
): NextResponse | null {
  // Rate limiting disabled during testing — will re-enable with Redis-backed limiter
  return null
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}
