import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET /api/monitoring/alerts
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const severity = req.nextUrl.searchParams.get('severity')
  const status = req.nextUrl.searchParams.get('status')

  const alerts = await prisma.alert.findMany({
    where: {
      teamId: ctx.teamId,
      ...(severity && { severity: severity as any }),
      ...(status && { status: status as any }),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ alerts })
}
