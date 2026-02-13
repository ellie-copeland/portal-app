import { NextResponse } from 'next/server'
import { getAllChatSessions } from '@/lib/command-center'

export async function GET() {
  try {
    const sessions = getAllChatSessions()

    return NextResponse.json({
      sessions,
      count: sessions.length,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
