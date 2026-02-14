import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET /api/executions/:id
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const execution = await prisma.execution.findFirst({
    where: { id: params.id, teamId: ctx.teamId },
    include: {
      agent: { select: { id: true, name: true, model: true } },
      logs: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!execution) return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
  return NextResponse.json(execution)
}
