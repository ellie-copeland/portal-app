import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { updateAgentSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/agents/v2/:id
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const agent = await prisma.agent.findFirst({
    where: { id: params.id, teamId: ctx.teamId },
    include: {
      _count: { select: { executions: true, conversations: true, tasks: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  return NextResponse.json(agent)
}

// PATCH /api/agents/v2/:id
export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = updateAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const agent = await prisma.agent.updateMany({
    where: { id: params.id, teamId: ctx.teamId },
    data: parsed.data as any,
  })

  if (agent.count === 0) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const updated = await prisma.agent.findUnique({ where: { id: params.id } })

  await prisma.auditLog.create({
    data: { userId: ctx.userId, teamId: ctx.teamId, action: 'agent.update', resource: 'agent', resourceId: params.id },
  })

  return NextResponse.json(updated)
}

// DELETE /api/agents/v2/:id
export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const result = await prisma.agent.deleteMany({
    where: { id: params.id, teamId: ctx.teamId },
  })

  if (result.count === 0) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  await prisma.auditLog.create({
    data: { userId: ctx.userId, teamId: ctx.teamId, action: 'agent.delete', resource: 'agent', resourceId: params.id },
  })

  return NextResponse.json({ success: true })
}

// PUT /api/agents/v2/:id — Alias for PATCH
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PATCH(req, ctx as any)
}
