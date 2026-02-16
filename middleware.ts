/**
 * Global middleware
 * Handles CSRF validation, CSP headers, and security
 */

import { NextRequest, NextResponse } from 'next/server'
import { withCSRFValidation } from '@/lib/csrf'

export async function middleware(request: NextRequest) {
  // 1. CSRF validation for state-changing requests
  const csrfValid = await withCSRFValidation(request)

  if (!csrfValid) {
    // CSRF validation failed
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        code: 'CSRF_TOKEN_INVALID',
      },
      { status: 403 }
    )
  }

  // 2. Continue to handler
  const response = NextResponse.next()

  // 3. Add security headers
  addSecurityHeaders(response)

  return response
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy - disabled temporarily for debugging
  // TODO: Fix nonce injection for Next.js inline scripts
  // response.headers.set('Content-Security-Policy', ...CSP rules...)

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return response
}

// Configure which routes use the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
