/**
 * GET /api/users/me/export
 * GDPR data export endpoint
 * Returns all user data in a portable format
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
        agents: true,
        conversations: true,
        executions: {
          include: {
            logs: true,
          },
        },
        auditLogs: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch API keys (without actual keys, only metadata)
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        lastUsed: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    // Fetch integrations (without sensitive config)
    const integrations = await prisma.integration.findMany({
      where: {
        team: {
          members: {
            some: {
              userId: auth.userId,
            },
          },
        },
      },
      select: {
        id: true,
        provider: true,
        status: true,
        metadata: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Build export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      teams: user.teamMembers.map((tm) => ({
        teamId: tm.team.id,
        teamName: tm.team.name,
        role: tm.role,
        joinedAt: tm.joinedAt,
      })),
      agents: user.agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        model: agent.model,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      })),
      conversations: user.conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        agentId: conv.agentId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      executions: user.executions.map((exec) => ({
        id: exec.id,
        agentId: exec.agentId,
        trigger: exec.trigger,
        status: exec.status,
        input: exec.input,
        output: exec.output,
        error: exec.error,
        tokensUsed: exec.tokensUsed,
        cost: exec.cost,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
      })),
      apiKeys: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        lastUsed: key.lastUsed,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
      })),
      integrations,
      auditLogs: user.auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        createdAt: log.createdAt,
      })),
    }

    // Log the export
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'user:data_export',
        resource: 'user',
        resourceId: auth.userId,
        details: {
          exportedAt: new Date(),
        },
      },
    })

    // Return as JSON
    const filename = `gdpr-export-${auth.userId}-${new Date().toISOString().split('T')[0]}.json`

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
