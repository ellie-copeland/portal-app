import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET /api/templates
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const category = req.nextUrl.searchParams.get('category')

  const templates = await prisma.agentTemplate.findMany({
    where: category ? { category } : undefined,
    orderBy: { category: 'asc' },
  })

  return NextResponse.json({ templates })
}
