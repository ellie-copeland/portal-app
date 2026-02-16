/**
 * Integration service - loads appropriate client and handles execution
 */

import { prisma } from '@/lib/db'
import { SlackClient } from './clients/slack'
import { GitHubClient } from './clients/github'
import { SentryClient } from './clients/sentry'
import { LinearClient } from './clients/linear'
import { VercelClient } from './clients/vercel'
import { NotionClient } from './clients/notion'
import { GmailClient } from './clients/gmail'
import { HubSpotClient } from './clients/hubspot'
import { WhatsAppClient } from './clients/whatsapp'
import { TelegramClient } from './clients/telegram'
import {
  IntegrationExecutionRequest,
  IntegrationExecutionResponse,
  ProviderClient,
} from './types'

export class IntegrationService {
  /**
   * Get client for a provider
   */
  static getClient(provider: string, encryptedConfig: string): ProviderClient {
    switch (provider.toLowerCase()) {
      case 'slack':
        return new SlackClient(encryptedConfig)
      case 'github':
        return new GitHubClient(encryptedConfig)
      case 'sentry':
        return new SentryClient(encryptedConfig)
      case 'linear':
        return new LinearClient(encryptedConfig)
      case 'vercel':
        return new VercelClient(encryptedConfig)
      case 'notion':
        return new NotionClient(encryptedConfig)
      case 'gmail':
        return new GmailClient(encryptedConfig)
      case 'hubspot':
        return new HubSpotClient(encryptedConfig)
      case 'whatsapp':
        return new WhatsAppClient(encryptedConfig)
      case 'telegram':
        return new TelegramClient(encryptedConfig)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Execute integration action
   * This is the main entry point for agent execution
   */
  static async execute(
    teamId: string,
    provider: string,
    request: IntegrationExecutionRequest,
    approvalRequired: boolean = true
  ): Promise<IntegrationExecutionResponse> {
    try {
      // Load integration from database
      const integration = await prisma.integration.findUnique({
        where: {
          teamId_provider: {
            teamId,
            provider,
          },
        },
      })

      if (!integration) {
        return {
          success: false,
          error: `Integration not found for provider: ${provider}`,
        }
      }

      if (integration.status !== 'CONNECTED') {
        return {
          success: false,
          error: `Integration is not connected: ${integration.status}`,
        }
      }

      if (!integration.encryptedConfig) {
        return {
          success: false,
          error: 'Integration config not found',
        }
      }

      // Check if action requires approval
      if (approvalRequired && isHighRiskAction(request.action)) {
        // Create supervised action for approval
        const supervisedAction = await prisma.supervisedAction.create({
          data: {
            agentId: request.context?.agentId || '',
            type: request.action,
            draft: JSON.stringify(request.payload),
            status: 'PENDING',
            confidence: 0.8,
            reasoning: `Integration execution: ${provider}/${request.action}`,
            context: {
              provider,
              action: request.action,
            },
          },
        })

        return {
          success: false,
          error: 'Action requires approval',
          data: {
            supervisedActionId: supervisedAction.id,
            status: 'PENDING_APPROVAL',
          },
        }
      }

      // Get appropriate client
      const client = IntegrationService.getClient(provider, integration.encryptedConfig)

      // Execute the action
      const result = await client.execute(request)

      // Log execution if successful
      if (result.success) {
        // Log execution metrics
        console.log(`Integration execution successful: ${provider}/${request.action}`)
      }

      return result
    } catch (error: any) {
      console.error(`Integration execution error: ${error.message}`)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  }

  /**
   * Execute after approval
   */
  static async executeApproved(
    teamId: string,
    provider: string,
    supervisedActionId: string,
    request: IntegrationExecutionRequest
  ): Promise<IntegrationExecutionResponse> {
    try {
      // Update supervised action status
      await prisma.supervisedAction.update({
        where: { id: supervisedActionId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      })

      // Execute without approval gating
      const integration = await prisma.integration.findUnique({
        where: {
          teamId_provider: {
            teamId,
            provider,
          },
        },
      })

      if (!integration || !integration.encryptedConfig) {
        throw new Error('Integration not found')
      }

      const client = IntegrationService.getClient(provider, integration.encryptedConfig)
      const result = await client.execute(request)

      // Update supervised action with final output
      if (result.success) {
        await prisma.supervisedAction.update({
          where: { id: supervisedActionId },
          data: {
            finalOutput: JSON.stringify(result.data),
            status: 'APPROVED',
          },
        })
      }

      return result
    } catch (error: any) {
      console.error(`Approved execution error: ${error.message}`)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Test integration connectivity
   */
  static async test(teamId: string, provider: string): Promise<boolean> {
    try {
      const integration = await prisma.integration.findUnique({
        where: {
          teamId_provider: {
            teamId,
            provider,
          },
        },
      })

      if (!integration || !integration.encryptedConfig) {
        return false
      }

      const client = IntegrationService.getClient(provider, integration.encryptedConfig)
      return await client.test()
    } catch (error) {
      console.error(`Integration test failed: ${error}`)
      return false
    }
  }

  /**
   * Get config validation
   */
  static async validateConfig(provider: string, config: Record<string, any>): Promise<boolean> {
    try {
      // Create a temporary client to validate config
      const tempConfig = require('@/lib/crypto').encrypt(JSON.stringify(config))
      const client = IntegrationService.getClient(provider, tempConfig)
      return await client.validate(config)
    } catch (error) {
      console.error(`Config validation failed: ${error}`)
      return false
    }
  }
}

/**
 * Determine if action requires approval
 * High-risk actions: sending messages, creating issues, updating data
 */
function isHighRiskAction(action: string): boolean {
  const highRiskActions = [
    'send_message',
    'create_issue',
    'create_pr_comment',
    'post_thread',
    'create_page',
    'send_reply',
    'send_whatsapp_message',
    'send_telegram_message',
    'create_contact',
    'create_deal',
    'update_deal',
  ]

  return highRiskActions.some((a) => action.includes(a))
}
