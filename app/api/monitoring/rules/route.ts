import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { createWatchRuleSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/monitoring/rules
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const rules = await prisma.watchRule.findMany({
    where: { teamId: ctx.teamId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ rules })
}

// POST /api/monitoring/rules
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = createWatchRuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const rule = await prisma.watchRule.create({
    data: { ...parsed.data, config: parsed.data.config ? JSON.parse(JSON.stringify(parsed.data.config)) : undefined, teamId: ctx.teamId },
  })

  return NextResponse.json(rule, { status: 201 })
}
