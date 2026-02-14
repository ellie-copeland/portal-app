import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/auth/forgot-password — request a password reset
export async function POST(req: NextRequest) {
  const limited = rateLimit(getClientIp(req), 'auth')
  if (limited) return limited

  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const normalizedEmail = email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    // Always return success (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store in refresh_tokens table (reusing it for simplicity)
    await prisma.refreshToken.create({
      data: {
        token: `reset_${token}`,
        userId: user.id,
        expiresAt,
      },
    })

    // TODO: Send email via Resend with reset link
    // For now, log the reset URL (visible in Vercel function logs for admin use)
    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`
    console.log(`[PASSWORD RESET] ${normalizedEmail} → ${resetUrl}`)

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
