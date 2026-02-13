import { NextResponse } from 'next/server'
import { getConversationsByContext } from '@/lib/command-center'

export async function GET() {
  try {
    const conversations = getConversationsByContext()

    return NextResponse.json({
      conversations,
      count: conversations.length,
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
