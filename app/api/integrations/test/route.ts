import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    const body = await req.json()
    const { provider, credentials } = body

    if (!provider || !credentials) {
      return NextResponse.json(
        { error: 'Provider and credentials are required' },
        { status: 400 }
      )
    }

    const result = await testIntegration(provider, credentials)

    return NextResponse.json({
      success: result.success,
      message: result.message,
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json(
      { error: 'Test failed', success: false },
      { status: 500 }
    )
  }
}

async function testIntegration(
  provider: string,
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  switch (provider) {
    case 'sentry':
      return testSentry(credentials)
    case 'linear':
      return testLinear(credentials)
    case 'vercel':
      return testVercel(credentials)
    case 'notion':
      return testNotion(credentials)
    case 'telegram':
      return testTelegram(credentials)
    case 'whatsapp':
      return testWhatsApp(credentials)
    case 'github':
      return testGitHub(credentials)
    case 'gmail':
      return testGmail(credentials)
    case 'hubspot':
      return testHubSpot(credentials)
    case 'slack':
      return testSlack(credentials)
    default:
      return { success: false, message: 'Unknown provider' }
  }
}

async function testSentry(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const token = credentials.token?.trim()
    if (!token) return { success: false, message: 'Missing token' }

    const response = await fetch('https://sentry.io/api/0/organizations/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      return { success: true, message: 'Sentry connection successful' }
    }

    return { success: false, message: 'Invalid Sentry token' }
  } catch (error) {
    return { success: false, message: 'Failed to test Sentry connection' }
  }
}

async function testLinear(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const token = credentials.token?.trim()
    if (!token) return { success: false, message: 'Missing token' }

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { viewer { id } }`,
      }),
    })

    const data = await response.json()

    if (!data.errors) {
      return { success: true, message: 'Linear connection successful' }
    }

    return { success: false, message: 'Invalid Linear token' }
  } catch (error) {
    return { success: false, message: 'Failed to test Linear connection' }
  }
}

async function testVercel(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const token = credentials.token?.trim()
    if (!token) return { success: false, message: 'Missing token' }

    const response = await fetch('https://api.vercel.com/v1/teams', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      return { success: true, message: 'Vercel connection successful' }
    }

    return { success: false, message: 'Invalid Vercel token' }
  } catch (error) {
    return { success: false, message: 'Failed to test Vercel connection' }
  }
}

async function testNotion(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const token = credentials.token?.trim()
    if (!token) return { success: false, message: 'Missing token' }

    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    })

    if (response.ok) {
      return { success: true, message: 'Notion connection successful' }
    }

    return { success: false, message: 'Invalid Notion token' }
  } catch (error) {
    return { success: false, message: 'Failed to test Notion connection' }
  }
}

async function testTelegram(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const token = credentials.bot_token?.trim()
    if (!token) return { success: false, message: 'Missing bot token' }

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)

    if (response.ok) {
      return { success: true, message: 'Telegram connection successful' }
    }

    return { success: false, message: 'Invalid Telegram bot token' }
  } catch (error) {
    return { success: false, message: 'Failed to test Telegram connection' }
  }
}

async function testWhatsApp(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const phoneId = credentials.phone_id?.trim()
    const token = credentials.access_token?.trim()

    if (!phoneId || !token) {
      return { success: false, message: 'Missing phone ID or access token' }
    }

    const response = await fetch(
      `https://graph.instagram.com/v17.0/${phoneId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.ok) {
      return { success: true, message: 'WhatsApp connection successful' }
    }

    return { success: false, message: 'Invalid WhatsApp credentials' }
  } catch (error) {
    return { success: false, message: 'Failed to test WhatsApp connection' }
  }
}

// For OAuth-based integrations, we can't fully test without the token
// But we can provide placeholder messages
async function testGitHub(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: 'GitHub OAuth flow configured. Will be fully tested after authorization.',
  }
}

async function testGmail(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: 'Gmail OAuth flow configured. Will be fully tested after authorization.',
  }
}

async function testHubSpot(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: 'HubSpot OAuth flow configured. Will be fully tested after authorization.',
  }
}

async function testSlack(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: 'Slack OAuth flow configured. Will be fully tested after authorization.',
  }
}
