import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { createConversationSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/conversations
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const agentId = req.nextUrl.searchParams.get('agentId')

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: ctx.userId,
      ...(agentId && { agentId }),
      agent: { teamId: ctx.teamId },
    },
    include: {
      agent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ conversations })
}

// POST /api/conversations
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = createConversationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Verify agent belongs to user's team
  const agent = await prisma.agent.findFirst({
    where: { id: parsed.data.agentId, teamId: ctx.teamId },
  })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const conversation = await prisma.conversation.create({
    data: {
      agentId: parsed.data.agentId,
      userId: ctx.userId,
      title: parsed.data.title || `Chat with ${agent.name}`,
    },
    include: { agent: { select: { id: true, name: true } } },
  })

  return NextResponse.json(conversation, { status: 201 })
}
