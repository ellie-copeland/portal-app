import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Command Center requires local OpenClaw CLI access — returns empty on cloud deployments
  return NextResponse.json({ data: [], message: 'Command Center not available in cloud deployment' })
}
