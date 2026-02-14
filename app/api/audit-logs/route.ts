import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  const logs = await prisma.auditLog.findMany({
    where: { teamId: ctx.teamId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200),
  })

  const formatted = logs.map(log => ({
    id: log.id,
    timestamp: log.createdAt,
    user: log.user?.name || log.user?.email || 'System',
    action: log.action,
    target: log.resource || '-',
    resourceId: log.resourceId,
    risk: log.action.includes('delete') || log.action.includes('DENIED') ? 'high'
      : log.action.includes('update') || log.action.includes('key') ? 'medium'
      : 'low',
  }))

  return NextResponse.json({ logs: formatted })
}
