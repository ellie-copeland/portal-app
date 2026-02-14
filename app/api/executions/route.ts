import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET /api/executions
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const status = req.nextUrl.searchParams.get('status')
  const agentId = req.nextUrl.searchParams.get('agentId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  const executions = await prisma.execution.findMany({
    where: {
      teamId: ctx.teamId,
      ...(status && { status: status as any }),
      ...(agentId && { agentId }),
    },
    include: {
      agent: { select: { id: true, name: true, model: true } },
      _count: { select: { logs: true } },
    },
    orderBy: { startedAt: 'desc' },
    take: Math.min(limit, 100),
  })

  return NextResponse.json({ executions })
}
