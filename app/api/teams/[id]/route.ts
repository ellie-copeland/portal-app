import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET /api/teams/:id
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const team = await prisma.team.findFirst({
    where: { id: params.id, members: { some: { userId: ctx.userId } } },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
      },
      _count: { select: { agents: true, executions: true, tasks: true } },
    },
  })

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  return NextResponse.json(team)
}
