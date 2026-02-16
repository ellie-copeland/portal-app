/**
 * POST /api/integrations/execute
 * Execute integration action from agent
 * 
 * This is the main entry point for agents to interact with integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { IntegrationService } from '@/lib/integrations/service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    const body = await req.json()
    const { provider, action, payload, approvalRequired = true, supervisedActionId } = body

    if (!provider || !action) {
      return NextResponse.json(
        { error: 'Provider and action are required' },
        { status: 400 }
      )
    }

    // Check if this is an approved execution
    if (supervisedActionId) {
      // Verify the supervised action exists and is approved
      const supervisedAction = await prisma.supervisedAction.findUnique({
        where: { id: supervisedActionId },
        include: { agent: { select: { teamId: true } } },
      })

      if (!supervisedAction) {
        return NextResponse.json({ error: 'Supervised action not found' }, { status: 404 })
      }

      if (supervisedAction.agent.teamId !== auth.teamId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (supervisedAction.status !== 'APPROVED') {
        return NextResponse.json(
          { error: `Action status is ${supervisedAction.status}, not approved` },
          { status: 400 }
        )
      }

      // Execute the approved action
      const result = await IntegrationService.executeApproved(
        auth.teamId,
        provider,
        supervisedActionId,
        {
          action,
          payload,
          context: {
            userId: auth.userId,
            teamId: auth.teamId,
            agentId: supervisedAction.agentId,
          },
        }
      )

      // Log execution
      await logExecution(auth.teamId, auth.userId, provider, action, result)

      return NextResponse.json(result)
    }

    // Normal execution (may require approval)
    const result = await IntegrationService.execute(
      auth.teamId,
      provider,
      {
        action,
        payload,
        context: {
          userId: auth.userId,
          teamId: auth.teamId,
          approvalRequired,
        },
      },
      approvalRequired
    )

    // Log execution
    await logExecution(auth.teamId, auth.userId, provider, action, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Integration execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Integration execution failed' },
      { status: 500 }
    )
  }
}

/**
 * Log integration execution to audit logs
 */
async function logExecution(
  teamId: string,
  userId: string | undefined,
  provider: string,
  action: string,
  result: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        teamId,
        action: `integration.execute`,
        resource: 'integration',
        resourceId: `${provider}/${action}`,
        details: {
          provider,
          action,
          success: result.success,
          error: result.error,
        },
        ip: undefined, // Would get from headers in production
      },
    })
  } catch (error) {
    console.error('Failed to log execution:', error)
    // Don't fail the execution if logging fails
  }
}
