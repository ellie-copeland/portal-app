/**
 * GET /api/csrf-token
 * Get CSRF token for client-side state-changing requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCSRFTokenResponse } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = await getCSRFTokenResponse()
    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.error('Failed to generate CSRF token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
