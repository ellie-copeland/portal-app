import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from './auth'
import { prisma } from './db'

export interface AuthContext {
  userId: string
  email: string
  role: string
  teamId: string
  teamRole: string
}

// Get authenticated user + their active team
export async function getAuthContext(req: NextRequest): Promise<AuthContext | NextResponse> {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for active team header (set by frontend team switcher)
  const requestedTeamId = req.headers.get('x-team-id')

  let membership
  if (requestedTeamId) {
    // Verify user belongs to requested team
    membership = await prisma.teamMember.findFirst({
      where: { userId: user.userId, teamId: requestedTeamId },
      include: { team: true },
    })
  }

  // Fallback to first team
  if (!membership) {
    membership = await prisma.teamMember.findFirst({
      where: { userId: user.userId },
      include: { team: true },
      orderBy: { joinedAt: 'asc' },
    })
  }

  if (!membership) {
    return NextResponse.json({ error: 'No team found' }, { status: 403 })
  }

  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
    teamId: membership.teamId,
    teamRole: membership.role,
  }
}

// Check if auth context (not an error response)
export function isAuthContext(ctx: AuthContext | NextResponse): ctx is AuthContext {
  return !(ctx instanceof NextResponse)
}
