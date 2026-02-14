import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createAccessToken, createRefreshToken } from '@/lib/auth'
import { signinSchema } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const limited = rateLimit(getClientIp(req), 'auth')
  if (limited) return limited

  try {
    const body = await req.json()
    const parsed = signinSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const { password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teamMembers: {
          include: { team: { select: { id: true, name: true, slug: true, plan: true } } },
          take: 1,
        },
      },
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const accessToken = await createAccessToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = await createRefreshToken({ userId: user.id })

    // Store refresh token (delete old ones first)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Audit log
    const teamId = user.teamMembers[0]?.team.id
    await prisma.auditLog.create({
      data: { userId: user.id, teamId, action: 'auth.signin', resource: 'user', resourceId: user.id },
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      team: user.teamMembers[0]?.team || null,
      accessToken,
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
