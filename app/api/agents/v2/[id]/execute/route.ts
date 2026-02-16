/**
 * POST /api/agents/v2/[id]/execute
 * 
 * Agent execution endpoint - allows agents to:
 * 1. Run integrations (Slack, GitHub, etc.)
 * 2. Create supervised actions for approval
 * 3. Track execution history
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { IntegrationService } from '@/lib/integrations/service'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    const body = await req.json()
    const { provider, action, payload, approvalRequired = true } = body

    if (!provider || !action) {
      return NextResponse.json(
        { error: 'Provider and action are required' },
        { status: 400 }
      )
    }

    // Verify agent exists and belongs to team
    const agent = await prisma.agent.findFirst({
      where: { id: params.id, teamId: auth.teamId },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check if agent is active
    if (agent.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Agent is inactive' }, { status: 400 })
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        agentId: agent.id,
        teamId: auth.teamId,
        userId: auth.userId,
        trigger: 'integration_request',
        status: 'RUNNING',
        input: JSON.stringify({ provider, action, payload }),
        metadata: {
          provider,
          action,
        },
      },
    })

    try {
      // Execute the integration action
      const result = await IntegrationService.execute(
        auth.teamId,
        provider,
        {
          action,
          payload,
          context: {
            userId: auth.userId,
            teamId: auth.teamId,
            agentId: agent.id,
            approvalRequired,
          },
        },
        approvalRequired
      )

      // Handle approval required case
      if (result.data?.status === 'PENDING_APPROVAL') {
        // Update execution to awaiting approval
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: 'RUNNING',
            metadata: {
              ...(typeof execution.metadata === 'object' && execution.metadata !== null ? execution.metadata : {}),
              supervisedActionId: result.data.supervisedActionId,
              awaitingApproval: true,
            },
          },
        })

        return NextResponse.json(
          {
            success: false,
            awaitingApproval: true,
            supervisedActionId: result.data.supervisedActionId,
            message: 'Action requires approval',
          },
          { status: 202 } // 202 Accepted - processing but not complete
        )
      }

      // Update execution with result
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          output: JSON.stringify(result.data),
          error: result.error,
          completedAt: new Date(),
          metadata: {
            ...(typeof execution.metadata === 'object' && execution.metadata !== null ? execution.metadata : {}),
            executionTime: result.metadata?.executionTime,
          },
        },
      })

      // Log in audit trail
      await logIntegrationExecution(
        auth.teamId,
        auth.userId,
        agent.id,
        provider,
        action,
        result.success
      )

      return NextResponse.json(
        {
          success: result.success,
          executionId: execution.id,
          data: result.data,
          error: result.error,
        },
        { status: result.success ? 200 : 400 }
      )
    } catch (error: any) {
      // Update execution as failed
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error',
          completedAt: new Date(),
        },
      })

      throw error
    }
  } catch (error: any) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    )
  }
}

/**
 * Log integration execution to audit trail
 */
async function logIntegrationExecution(
  teamId: string,
  userId: string | undefined,
  agentId: string,
  provider: string,
  action: string,
  success: boolean
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        teamId,
        action: `integration.${action}`,
        resource: 'integration',
        resourceId: `${provider}/${action}`,
        details: {
          provider,
          action,
          agentId,
          success,
        },
      },
    })
  } catch (error) {
    console.error('Failed to log integration execution:', error)
  }
}

/**
 * GET /api/agents/v2/[id]/execute
 * Get execution history for agent
 */
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const auth = await getAuthContext(req)
  if (!isAuthContext(auth)) return auth

  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const status = req.nextUrl.searchParams.get('status')

    const executions = await prisma.execution.findMany({
      where: {
        agentId: params.id,
        teamId: auth.teamId,
        ...(status && { status: status as any }),
      },
      include: {
        logs: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, 100),
    })

    return NextResponse.json({ executions })
  } catch (error: any) {
    console.error('Failed to fetch executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}
