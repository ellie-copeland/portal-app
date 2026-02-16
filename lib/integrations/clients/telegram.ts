/**
 * Telegram integration client
 * Handles: send_message, get_updates
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

const TELEGRAM_API = 'https://api.telegram.org'

export class TelegramClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('telegram', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.bot_token || typeof config.bot_token !== 'string') {
      return false
    }
    if (!config.bot_token.includes(':')) {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const config = this.getConfig()
      const response = await fetch(`${TELEGRAM_API}/bot${config.bot_token}/getMe`)
      return response.ok
    } catch (error) {
      console.error('Telegram test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.SEND_TELEGRAM_MESSAGE:
        return this.sendMessage(request.payload)

      case IntegrationAction.GET_TELEGRAM_UPDATES:
        return this.getUpdates(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Send a Telegram message
   * Payload: { chatId: string|number, text: string }
   */
  private async sendMessage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { chatId, text } = payload

      if (!chatId || !text) throw new Error('Chat ID and text are required')

      const response = await fetch(
        `${TELEGRAM_API}/bot${config.bot_token}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        }
      )

      if (!response.ok) throw new Error(`Telegram API error: ${response.status}`)

      const result = await response.json()

      return {
        messageId: result.result?.message_id,
        chatId: result.result?.chat?.id,
        success: result.ok,
      }
    }, 'send_message')
  }

  /**
   * Get updates/messages
   * Payload: { offset?: number, limit?: number }
   */
  private async getUpdates(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { offset = 0, limit = 100 } = payload

      const response = await fetch(
        `${TELEGRAM_API}/bot${config.bot_token}/getUpdates?offset=${offset}&limit=${Math.min(limit, 100)}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) throw new Error(`Telegram API error: ${response.status}`)

      const result = await response.json()

      return result.result?.map((update: any) => ({
        updateId: update.update_id,
        message: update.message,
        callbackQuery: update.callback_query,
      }))
    }, 'get_updates')
  }
}
