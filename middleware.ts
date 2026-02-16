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
  // Content Security Policy - with unsafe-inline for Next.js compatibility
  // TODO: Implement proper nonce injection for all scripts
  response.headers.set(
    'Content-Security-Policy',
    `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
  `.replace(/\n/g, ' ')
  )

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Store nonce for use in components
  response.headers.set('X-Nonce', nonce)

  return response
}

/**
 * Generate a random nonce for inline scripts
 */
function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let nonce = ''
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return nonce
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
