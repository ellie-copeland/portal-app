import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST /api/invitations/:token/accept — Accept an invitation
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  try {
    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: { team: true },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { token: params.token },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    // Check if invitation is already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }

    // Check if the user's email matches the invitation
    if (ctx.email !== invitation.email) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: invitation.teamId,
        userId: ctx.userId,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 })
    }

    // Create team member and mark invitation as accepted
    const [_, updatedInvitation] = await Promise.all([
      prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: ctx.userId,
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { token: params.token },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      }),
    ])

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        teamId: invitation.teamId,
        action: 'invitation.accept',
        resource: 'invitation',
        resourceId: invitation.id,
      },
    })

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      teamId: invitation.teamId,
      teamName: invitation.team.name,
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
