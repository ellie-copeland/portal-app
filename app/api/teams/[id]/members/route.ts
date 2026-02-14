import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { inviteMemberSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// POST /api/teams/:id/members — Invite member
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  // Check caller is OWNER or ADMIN
  const callerMembership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: ctx.userId, teamId: params.id } },
  })
  if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = inviteMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Find user by email
  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!invitee) {
    return NextResponse.json({ error: 'User not found. They need to sign up first.' }, { status: 404 })
  }

  // Check not already a member
  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: invitee.id, teamId: params.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
  }

  const member = await prisma.teamMember.create({
    data: { userId: invitee.id, teamId: params.id, role: parsed.data.role as any },
    include: { user: { select: { id: true, email: true, name: true } } },
  })

  await prisma.auditLog.create({
    data: { userId: ctx.userId, teamId: params.id, action: 'team.invite', resource: 'team_member', resourceId: member.id },
  })

  return NextResponse.json(member, { status: 201 })
}

// DELETE /api/teams/:id/members — Remove member (expects ?userId=xxx)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const targetUserId = req.nextUrl.searchParams.get('userId')
  if (!targetUserId) {
    return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
  }

  const callerMembership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: ctx.userId, teamId: params.id } },
  })
  if (!callerMembership || !['OWNER', 'ADMIN'].includes(callerMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Can't remove owner
  const target = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: targetUserId, teamId: params.id } },
  })
  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }
  if (target.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 403 })
  }

  await prisma.teamMember.delete({ where: { id: target.id } })

  await prisma.auditLog.create({
    data: { userId: ctx.userId, teamId: params.id, action: 'team.remove_member', resource: 'team_member', resourceId: target.id },
  })

  return NextResponse.json({ success: true })
}
