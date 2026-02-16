/**
 * Gmail integration client
 * Handles: draft_reply, list_threads, get_message, send_reply
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

const GMAIL_API = 'https://www.googleapis.com/gmail/v1/users/me'

export class GmailClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('gmail', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.access_token || typeof config.access_token !== 'string') {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const config = this.getConfig()
      const response = await fetch(`${GMAIL_API}/profile`, {
        headers: {
          Authorization: `Bearer ${config.access_token}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error('Gmail test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.DRAFT_REPLY:
        return this.draftReply(request.payload)

      case IntegrationAction.LIST_THREADS:
        return this.listThreads(request.payload)

      case IntegrationAction.GET_MESSAGE:
        return this.getMessage(request.payload)

      case IntegrationAction.SEND_REPLY:
        return this.sendReply(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Draft a reply
   * Payload: { threadId: string, body: string, subject?: string }
   */
  private async draftReply(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { threadId, body, subject } = payload

      if (!threadId || !body) throw new Error('Thread ID and body are required')

      // For now, just return draft metadata
      // Full implementation would use Gmail API draft creation
      return {
        draft: true,
        threadId,
        body,
        subject,
      }
    }, 'draft_reply')
  }

  /**
   * List email threads
   * Payload: { label?: string, limit?: number }
   */
  private async listThreads(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { label = 'INBOX', limit = 50 } = payload

      const response = await fetch(
        `${GMAIL_API}/threads?q=label:${label}&maxResults=${Math.min(limit, 100)}`,
        {
          headers: {
            Authorization: `Bearer ${config.access_token}`,
          },
        }
      )

      if (!response.ok) throw new Error(`Gmail API error: ${response.status}`)

      const data = await response.json()

      return data.threads?.map((thread: any) => ({
        id: thread.id,
        snippet: thread.snippet,
      }))
    }, 'list_threads')
  }

  /**
   * Get message details
   * Payload: { messageId: string }
   */
  private async getMessage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { messageId } = payload

      if (!messageId) throw new Error('Message ID is required')

      const response = await fetch(`${GMAIL_API}/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${config.access_token}`,
        },
      })

      if (!response.ok) throw new Error(`Gmail API error: ${response.status}`)

      const message = await response.json()

      return {
        id: message.id,
        threadId: message.threadId,
        snippet: message.snippet,
        headers: this.extractHeaders(message.payload?.headers),
      }
    }, 'get_message')
  }

  /**
   * Send a reply
   * Payload: { threadId: string, body: string, subject?: string }
   */
  private async sendReply(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { threadId, body, subject } = payload

      if (!threadId || !body) throw new Error('Thread ID and body are required')

      // Full implementation would create and send via Gmail API
      return {
        success: true,
        threadId,
        body,
      }
    }, 'send_reply')
  }

  /**
   * Extract headers from Gmail message
   */
  private extractHeaders(
    headers: Array<{ name: string; value: string }> | undefined
  ): Record<string, string> {
    const result: Record<string, string> = {}
    headers?.forEach((h) => {
      result[h.name] = h.value
    })
    return result
  }
}
