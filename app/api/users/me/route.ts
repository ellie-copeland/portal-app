import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { updateProfileSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/users/me
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true,
      teamMembers: {
        include: { team: { select: { id: true, name: true, slug: true, plan: true } } },
      },
      _count: { select: { agents: true, apiKeys: true } },
    },
  })

  return NextResponse.json(user)
}

// PATCH /api/users/me
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data: parsed.data,
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  })

  return NextResponse.json(user)
}
