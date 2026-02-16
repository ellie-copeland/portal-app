import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/integrations/list
 * Lists all connected integrations for a team
 * Used by agents to see what integrations are available
 */
export async function GET(req: NextRequest) {
  try {
    // Extract team ID from header (agents pass this)
    const teamId = req.headers.get('x-team-id')
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'x-team-id header required' },
        { status: 400 }
      )
    }

    // Fetch all connected integrations for the team
    const integrations = await prisma.integration.findMany({
      where: {
        teamId,
        status: 'CONNECTED',
      },
      select: {
        id: true,
        provider: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Format for agent consumption
    const formattedIntegrations = integrations.map(integration => {
      const metadata = integration.metadata as Record<string, any> || {}
      
      return {
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        connected: true,
        metadata: {
          // Safely expose metadata depending on provider
          agentId: metadata.agentId,
          deploymentMethod: metadata.deploymentMethod,
          // Provider-specific data
          ...(integration.provider === 'slack' && {
            workspace: metadata.workspace,
            channels: metadata.channels || [],
          }),
          ...(integration.provider === 'github' && {
            repos: metadata.repos || [],
          }),
          ...(integration.provider === 'sentry' && {
            organization: metadata.organization,
            projects: metadata.projects || [],
          }),
          ...(integration.provider === 'linear' && {
            team: metadata.team,
            projects: metadata.projects || [],
          }),
          ...(integration.provider === 'vercel' && {
            projects: metadata.projects || [],
          }),
          ...(integration.provider === 'notion' && {
            pages: metadata.pages || [],
          }),
          ...(integration.provider === 'gmail' && {
            labels: metadata.labels || [],
          }),
          ...(integration.provider === 'hubspot' && {
            organization: metadata.organization,
          }),
          ...(integration.provider === 'whatsapp' && {
            phoneId: metadata.phone_id,
          }),
        },
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }
    })

    return NextResponse.json({
      teamId,
      integrations: formattedIntegrations,
      count: formattedIntegrations.length,
    })
  } catch (error) {
    console.error('Failed to list integrations:', error)
    return NextResponse.json(
      { error: 'Failed to list integrations' },
      { status: 500 }
    )
  }
}
