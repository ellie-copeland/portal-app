import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/auth/reset-password — reset password with token
export async function POST(req: NextRequest) {
  const limited = rateLimit(getClientIp(req), 'auth')
  if (limited) return limited

  try {
    const { token, password } = await req.json()
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Valid token and password (8+ chars) required' }, { status: 400 })
    }

    // Find the reset token
    const resetToken = await prisma.refreshToken.findUnique({
      where: { token: `reset_${token}` },
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      // Clean up expired token if found
      if (resetToken) {
        await prisma.refreshToken.delete({ where: { id: resetToken.id } })
      }
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Update password
    const passwordHash = await hashPassword(password)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    // Delete the reset token
    await prisma.refreshToken.delete({ where: { id: resetToken.id } })

    // Invalidate all existing refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } })

    return NextResponse.json({ message: 'Password reset successfully. Please sign in.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
