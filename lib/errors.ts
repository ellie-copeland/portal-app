import { NextResponse } from 'next/server'

/**
 * Safe error response — logs internally, returns generic message to client.
 * Never leaks stack traces or internal details.
 */
export function safeError(context: string, error: unknown, status = 500): NextResponse {
  console.error(`[${context}]`, error)
  return NextResponse.json(
    { error: status === 500 ? 'Internal server error' : 'Request failed' },
    { status }
  )
}
