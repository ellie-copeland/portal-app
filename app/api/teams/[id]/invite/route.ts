import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { inviteMemberSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// POST /api/teams/:id/invite — Invite a member to team
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  try {
    const body = await req.json()
    const parsed = inviteMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    // Check if user is admin/owner of the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: ctx.userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: params.id },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        user: { email: parsed.data.email },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 })
    }

    // Create or update invitation
    const invitation = await prisma.invitation.upsert({
      where: {
        teamId_email: {
          teamId: params.id,
          email: parsed.data.email,
        },
      },
      update: {
        role: parsed.data.role,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      create: {
        teamId: params.id,
        email: parsed.data.email,
        role: parsed.data.role,
        token: `inv_${crypto.getRandomValues(new Uint8Array(16)).reduce((a, b) => a + b.toString(16), '')}`,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        teamId: params.id,
        action: 'invitation.create',
        resource: 'invitation',
        resourceId: invitation.id,
        details: { email: parsed.data.email, role: parsed.data.role },
      },
    })

    // Return invitation with public link
    return NextResponse.json(
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        token: invitation.token,
        inviteLink: `${new URL(req.url).origin}/invite/${invitation.token}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/teams/:id/invite — List pending invitations for team
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  try {
    // Check if user is member of the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: ctx.userId,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        teamId: params.id,
        status: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('List invitations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
