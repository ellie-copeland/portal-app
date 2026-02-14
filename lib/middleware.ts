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

  // Get user's primary team
  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.userId },
    include: { team: true },
    orderBy: { joinedAt: 'asc' },
  })

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
