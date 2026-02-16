import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/integrations/discover
 * Auto-discovers integrations for the authenticated user's team
 * Used by agents to automatically find available integrations
 */
export async function GET(req: NextRequest) {
  try {
    // Extract user ID from header (passed by agent/frontend)
    const userId = req.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'x-user-id header required' },
        { status: 400 }
      )
    }

    // Find user and their team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            integrations: {
              where: { status: 'CONNECTED' },
              select: {
                id: true,
                provider: true,
                status: true,
                metadata: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.teams || user.teams.length === 0) {
      return NextResponse.json(
        { 
          integrations: [],
          message: 'No team or integrations found for user'
        }
      )
    }

    // Get all integrations from user's team(s)
    const allIntegrations = user.teams.flatMap(team => 
      team.integrations.map(integ => ({
        ...integ,
        teamId: team.id,
        teamName: team.name,
      }))
    )

    // Format for agent consumption
    const formattedIntegrations = allIntegrations.map(integ => {
      const metadata = integ.metadata as Record<string, any> || {}
      
      return {
        id: integ.id,
        provider: integ.provider,
        teamName: integ.teamName,
        connected: true,
        // Provider-specific data agents care about
        data: {
          ...(integ.provider === 'github' && {
            repos: metadata.repos || [],
            type: 'GitHub Repositories',
          }),
          ...(integ.provider === 'slack' && {
            channels: metadata.channels || [],
            workspace: metadata.workspace,
            type: 'Slack Channels',
          }),
          ...(integ.provider === 'sentry' && {
            projects: metadata.projects || [],
            organization: metadata.organization,
            type: 'Sentry Projects',
          }),
          ...(integ.provider === 'linear' && {
            projects: metadata.projects || [],
            team: metadata.team,
            type: 'Linear Projects',
          }),
          ...(integ.provider === 'vercel' && {
            projects: metadata.projects || [],
            type: 'Vercel Deployments',
          }),
          ...(integ.provider === 'notion' && {
            pages: metadata.pages || [],
            type: 'Notion Workspace',
          }),
          ...(integ.provider === 'gmail' && {
            labels: metadata.labels || [],
            type: 'Email Labels',
          }),
          ...(integ.provider === 'hubspot' && {
            organization: metadata.organization,
            type: 'HubSpot CRM',
          }),
        },
        updatedAt: integ.updatedAt,
      }
    })

    return NextResponse.json({
      userId,
      integrations: formattedIntegrations,
      summary: {
        total: formattedIntegrations.length,
        providers: [...new Set(formattedIntegrations.map(i => i.provider))],
      },
    })
  } catch (error) {
    console.error('Failed to discover integrations:', error)
    return NextResponse.json(
      { error: 'Failed to discover integrations' },
      { status: 500 }
    )
  }
}
