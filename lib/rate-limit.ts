import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis — fails gracefully if env vars missing
let redis: Redis | null = null
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch {}

export interface RateLimitConfig {
  windowMs: number
  max: number
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, max: 10 },
  api: { windowMs: 60 * 1000, max: 60 },
  llm: { windowMs: 60 * 1000, max: 20 },
}

// Create Upstash rate limiters
const limiters: Record<string, Ratelimit> = {}
function getLimiter(preset: string): Ratelimit | null {
  if (!redis) return null
  if (!limiters[preset]) {
    const config = DEFAULTS[preset] || DEFAULTS.api
    const windowSec = Math.max(1, Math.floor(config.windowMs / 1000))
    limiters[preset] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.max, `${windowSec} s`),
      analytics: true,
      prefix: `rl:${preset}`,
    })
  }
  return limiters[preset]
}

// In-memory fallback (same as before) for when Redis is unavailable
interface RateLimitEntry { count: number; resetAt: number }
const store = new Map<string, RateLimitEntry>()
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

function inMemoryLimit(identifier: string, preset: string): NextResponse | null {
  const { windowMs, max } = DEFAULTS[preset] || DEFAULTS.api
  const key = `${preset}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++
  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(entry.resetAt),
        },
      }
    )
  }
  return null
}

export function rateLimit(
  identifier: string,
  preset: keyof typeof DEFAULTS | string = 'api',
  _config?: Partial<RateLimitConfig>
): NextResponse | null {
  // Synchronous check — use in-memory as quick guard
  // The async Upstash check happens in rateLimitAsync
  return inMemoryLimit(identifier, preset)
}

export async function rateLimitAsync(
  identifier: string,
  preset: string = 'api'
): Promise<NextResponse | null> {
  const limiter = getLimiter(preset)
  if (!limiter) return inMemoryLimit(identifier, preset)

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    return null
  } catch (err) {
    // Redis down — fail open with in-memory fallback
    console.error('Upstash rate limit error (falling back to in-memory):', err)
    return inMemoryLimit(identifier, preset)
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

export { redis }
