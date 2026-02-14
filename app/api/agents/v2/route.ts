import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { createAgentSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/agents/v2 — List agents for current team
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const status = req.nextUrl.searchParams.get('status')
  const type = req.nextUrl.searchParams.get('type')

  const agents = await prisma.agent.findMany({
    where: {
      teamId: ctx.teamId,
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
    },
    include: {
      _count: { select: { executions: true, conversations: true, tasks: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ agents })
}

// POST /api/agents/v2 — Create agent
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = createAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { config, ...rest } = parsed.data
  const agent = await prisma.agent.create({
    data: {
      ...rest,
      config: config ? JSON.parse(JSON.stringify(config)) : undefined,
      teamId: ctx.teamId,
      createdById: ctx.userId,
    },
  })

  await prisma.auditLog.create({
    data: { userId: ctx.userId, teamId: ctx.teamId, action: 'agent.create', resource: 'agent', resourceId: agent.id },
  })

  return NextResponse.json(agent, { status: 201 })
}
