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
