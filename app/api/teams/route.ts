import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { createTeamSchema } from '@/lib/validation'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/teams — List user's teams
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId: ctx.userId },
        },
      },
      include: {
        members: { select: { id: true, role: true } },
        _count: { select: { members: true, agents: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('List teams error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/teams — Create team
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  try {
    const body = await req.json()
    const parsed = createTeamSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        slug: `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`,
        members: {
          create: { userId: ctx.userId, role: 'OWNER' },
        },
      },
      include: { members: { include: { user: { select: { id: true, email: true, name: true } } } } },
    })

    await prisma.auditLog.create({
      data: { userId: ctx.userId, teamId: team.id, action: 'team.create', resource: 'team', resourceId: team.id },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
