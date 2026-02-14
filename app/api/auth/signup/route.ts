import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createAccessToken, createRefreshToken } from '@/lib/auth'
import { signupSchema } from '@/lib/validation'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { email, password, name } = parsed.data

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || email.split('@')[0] },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    // Create default team
    const team = await prisma.team.create({
      data: {
        name: `${user.name}'s Team`,
        slug: `team-${crypto.randomBytes(4).toString('hex')}`,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
    })

    // Generate tokens
    const accessToken = await createAccessToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = await createRefreshToken({ userId: user.id })

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: { userId: user.id, teamId: team.id, action: 'auth.signup', resource: 'user', resourceId: user.id },
    })

    const response = NextResponse.json({
      user,
      team: { id: team.id, name: team.name, slug: team.slug },
      accessToken,
    }, { status: 201 })

    // Set refresh token as httpOnly cookie
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
