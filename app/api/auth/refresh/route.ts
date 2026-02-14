import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAccessToken, createRefreshToken, verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('refresh_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    // Verify token is valid and not expired
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Check token exists in DB (not revoked)
    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
      return NextResponse.json({ error: 'Token expired or revoked' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Rotate tokens
    await prisma.refreshToken.delete({ where: { id: stored.id } })

    const newAccessToken = await createAccessToken({ userId: user.id, email: user.email, role: user.role })
    const newRefreshToken = await createRefreshToken({ userId: user.id })

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const response = NextResponse.json({ accessToken: newAccessToken })

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
