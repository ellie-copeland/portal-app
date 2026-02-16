/**
 * POST /api/integrations/test-all
 * Test all integrations for a team
 * Returns status of each connected integration
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
    // Get all integrations for team
    const integrations = await prisma.integration.findMany({
      where: { teamId: auth.teamId },
    })

    const results: Record<string, { status: string; connected: boolean; error?: string }> = {}

    // Test each integration
    for (const integration of integrations) {
      try {
        const isConnected = await IntegrationService.test(auth.teamId, integration.provider)
        results[integration.provider] = {
          status: isConnected ? 'connected' : 'disconnected',
          connected: isConnected,
        }
      } catch (error: any) {
        results[integration.provider] = {
          status: 'error',
          connected: false,
          error: error.message,
        }
      }
    }

    // Log test in audit trail
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        teamId: auth.teamId,
        action: 'integration:test_all',
        resource: 'integration',
        details: results,
      },
    })

    return NextResponse.json(
      {
        tested: Object.keys(results).length,
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Integration test failed:', error)
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}
