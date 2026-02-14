import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { encrypt } from '@/lib/crypto'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    const integrations = await prisma.integration.findMany({
      where: { teamId: auth.teamId },
      select: {
        id: true,
        provider: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        // Never return encrypted tokens
      },
    })

    return NextResponse.json(integrations)
  } catch (error) {
    console.error('Failed to fetch integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    const body = await req.json()
    const { provider, config, agentId, deploymentMethod } = body

    if (!provider || !config) {
      return NextResponse.json(
        { error: 'Provider and config are required' },
        { status: 400 }
      )
    }

    // Encrypt sensitive data
    const encryptedConfig = encrypt(JSON.stringify(config))

    // Check if integration already exists
    const existing = await prisma.integration.findUnique({
      where: {
        teamId_provider: {
          teamId: auth.teamId,
          provider,
        },
      },
    })

    let integration

    if (existing) {
      // Update existing
      integration = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          status: 'CONNECTED',
          encryptedConfig,
          metadata: extractMetadata(provider, config, agentId, deploymentMethod),
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new
      integration = await prisma.integration.create({
        data: {
          teamId: auth.teamId,
          provider,
          status: 'CONNECTED',
          encryptedConfig,
          metadata: extractMetadata(provider, config, agentId, deploymentMethod),
        },
      })
    }

    return NextResponse.json(integration, { status: 201 })
  } catch (error) {
    console.error('Failed to create integration:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}

function extractMetadata(
  provider: string,
  config: Record<string, any>,
  agentId?: string,
  deploymentMethod?: string
): Record<string, any> {
  const metadata: Record<string, any> = {}

  // Add agent and deployment info
  if (agentId) {
    metadata.agentId = agentId
  }
  if (deploymentMethod) {
    metadata.deploymentMethod = deploymentMethod
  }

  switch (provider) {
    case 'slack':
      metadata.workspace = config.workspace_name || 'Unknown'
      metadata.channels = config.channels || []
      break
    case 'github':
      metadata.repos = config.repos || []
      break
    case 'sentry':
      metadata.organization = config.organization
      metadata.projects = config.projects || []
      break
    case 'linear':
      metadata.team = config.team
      metadata.projects = config.projects || []
      break
    case 'vercel':
      metadata.projects = config.projects || []
      break
    case 'whatsapp':
      metadata.phone_id = config.phone_id
      break
    case 'telegram':
      // Don't store sensitive bot details in plain metadata
      break
    default:
      break
  }

  return metadata
}
