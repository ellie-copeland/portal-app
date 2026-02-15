import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { encrypt } from '@/lib/crypto'
import bcryptjs from 'bcryptjs'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const storeKeySchema = z.object({
  provider: z.enum(['openrouter', 'anthropic', 'openai', 'google', 'mistral']),
  key: z.string().min(10),
  label: z.string().max(100).optional(),
})

// Validate an API key by making a lightweight request to the provider
async function validateApiKey(provider: string, key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        })
        if (res.status === 401) return { valid: false, error: 'Invalid OpenAI API key' }
        if (res.status === 429) return { valid: true } // rate limited = key is valid
        return { valid: res.ok }
      }
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
          signal: AbortSignal.timeout(10000),
        })
        if (res.status === 401) return { valid: false, error: 'Invalid Anthropic API key' }
        if (res.status === 429) return { valid: true }
        return { valid: res.ok || res.status === 400 } // 400 = valid key, bad request
      }
      case 'google': {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
          signal: AbortSignal.timeout(10000),
        })
        if (res.status === 400 || res.status === 403) return { valid: false, error: 'Invalid Google AI API key' }
        if (res.status === 429) return { valid: true }
        return { valid: res.ok }
      }
      case 'openrouter': {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        })
        if (res.status === 401) return { valid: false, error: 'Invalid OpenRouter API key' }
        return { valid: res.ok }
      }
      case 'mistral': {
        const res = await fetch('https://api.mistral.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
          signal: AbortSignal.timeout(10000),
        })
        if (res.status === 401) return { valid: false, error: 'Invalid Mistral API key' }
        return { valid: res.ok }
      }
      default:
        return { valid: true } // skip validation for unknown providers
    }
  } catch {
    // Network error — don't block, allow save
    return { valid: true }
  }
}

// POST - Store an LLM API key
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = storeKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { provider, key, label } = parsed.data

  // Validate key before saving
  const validation = await validateApiKey(provider, key)
  if (!validation.valid) {
    return NextResponse.json({ error: { key: [validation.error || 'Invalid API key'] } }, { status: 400 })
  }

  const keyHash = await bcryptjs.hash(key, 10)
  const keyPrefix = key.substring(0, 8)
  const encryptedKey = encrypt(key)

  const apiKey = await prisma.userApiKey.upsert({
    where: { userId_provider: { userId: ctx.userId, provider } },
    create: { userId: ctx.userId, provider, keyHash, keyPrefix, encryptedKey, label },
    update: { keyHash, keyPrefix, encryptedKey, label },
  })

  return NextResponse.json({
    id: apiKey.id,
    provider: apiKey.provider,
    keyPrefix: apiKey.keyPrefix,
    label: apiKey.label,
    createdAt: apiKey.createdAt,
  }, { status: 201 })
}

// GET - List user's keys (prefix only)
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const keys = await prisma.userApiKey.findMany({
    where: { userId: ctx.userId },
    select: { id: true, provider: true, keyPrefix: true, label: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ keys })
}

// DELETE - Remove a key
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  const provider = searchParams.get('provider')

  if (id) {
    await prisma.userApiKey.deleteMany({ where: { id, userId: ctx.userId } })
  } else if (provider) {
    await prisma.userApiKey.deleteMany({ where: { userId: ctx.userId, provider } })
  } else {
    return NextResponse.json({ error: 'Provide id or provider' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
