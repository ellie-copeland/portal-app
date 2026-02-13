import { NextResponse } from 'next/server'
import { getAgentSessions, getOpenclaConfig } from '@/lib/command-center'

export async function GET() {
  try {
    const agents = getAgentSessions()
    const config = getOpenclaConfig()

    return NextResponse.json({
      agents,
      config: {
        defaultModel: config.agents?.defaults?.model?.primary || 'unknown',
      },
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}
