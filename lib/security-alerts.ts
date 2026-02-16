/**
 * Security Alerting System
 * Sends security alerts to Slack and creates Alert records
 */

import { prisma } from '@/lib/db'
import { logSecurityAlert } from './audit'

export interface SecurityAlertPayload {
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  message: string
  source: string
  teamId?: string
  userId?: string
  metadata?: Record<string, any>
  ip?: string
}

/**
 * Create a security alert
 */
export async function createSecurityAlert(payload: SecurityAlertPayload): Promise<void> {
  try {
    // Only create alert in database if teamId is provided
    let alert = null
    if (payload.teamId) {
      alert = await prisma.alert.create({
        data: {
          teamId: payload.teamId,
          agentId: payload.metadata?.agentId,
          severity: payload.severity,
          source: payload.source,
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata,
        },
      })
    }

    // Log to audit trail
    await logSecurityAlert(
      payload.teamId,
      payload.userId,
      payload.source,
      payload.severity.toLowerCase() as any,
      payload.metadata || {},
      payload.ip
    )

    // Send to Slack if webhook URL is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackAlert(payload)
    }

    console.log(`Security alert created: ${payload.title} (${payload.severity})`)
  } catch (error) {
    console.error('Failed to create security alert:', error)
  }
}

/**
 * Send alert to Slack webhook
 */
async function sendSlackAlert(payload: SecurityAlertPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    return
  }

  try {
    const color = {
      CRITICAL: '#FF0000',
      WARNING: '#FFA500',
      INFO: '#0099FF',
    }[payload.severity]

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: payload.title,
            text: payload.message,
            fields: [
              {
                title: 'Severity',
                value: payload.severity,
                short: true,
              },
              {
                title: 'Source',
                value: payload.source,
                short: true,
              },
              ...(payload.teamId
                ? [
                    {
                      title: 'Team',
                      value: payload.teamId,
                      short: true,
                    },
                  ]
                : []),
              ...(payload.ip
                ? [
                    {
                      title: 'IP',
                      value: payload.ip,
                      short: true,
                    },
                  ]
                : []),
            ],
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Failed to send Slack alert:', response.status)
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error)
  }
}

/**
 * Brute force detection
 * Track failed login attempts and alert if threshold exceeded
 */
export async function trackFailedLogin(
  email: string,
  ip: string
): Promise<{ blocked: boolean; attempts: number }> {
  const redisKey = `brute-force:${email}:${ip}`
  const maxAttempts = 5
  const windowMs = 15 * 60 * 1000 // 15 minutes

  // Using in-memory tracking for now (would use Redis in production)
  // This is a simplified implementation
  const attempts = 1 // Would increment from cache

  if (attempts >= maxAttempts) {
    await createSecurityAlert({
      severity: 'WARNING',
      title: 'Brute Force Detection',
      message: `Multiple failed login attempts from ${ip} for ${email}`,
      source: 'brute-force-detection',
      metadata: {
        email,
        ip,
        attempts,
      },
    })

    return { blocked: true, attempts }
  }

  return { blocked: false, attempts }
}

/**
 * Rate limit checker
 */
export async function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  // Would use Redis for distributed rate limiting
  // Simplified for now
  return { allowed: true, remaining: limit }
}

/**
 * Unusual activity detection
 */
export async function detectUnusualActivity(
  userId: string,
  action: string,
  metadata: Record<string, any>
): Promise<boolean> {
  // Check for unusual patterns
  // This could use ML models or rule-based detection
  // For now, return false (not unusual)
  return false
}

/**
 * Resolve a security alert
 */
export async function resolveSecurityAlert(
  alertId: string,
  resolvedBy?: string
): Promise<void> {
  try {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    })

    console.log(`Security alert resolved: ${alertId}`)
  } catch (error) {
    console.error('Failed to resolve alert:', error)
  }
}
