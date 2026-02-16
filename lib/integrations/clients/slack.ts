/**
 * Slack integration client
 * Handles: send_message, get_channels, get_users, post_thread, react
 */

import { WebClient } from '@slack/web-api'
import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

export class SlackClient extends BaseIntegrationClient {
  private client: WebClient | null = null

  constructor(encryptedConfig: string) {
    super('slack', encryptedConfig)
  }

  /**
   * Get authenticated Slack client
   */
  private getClient(): WebClient {
    if (!this.client) {
      const config = this.getConfig()
      const token = config.bot_token

      if (!token) {
        throw new Error('Slack bot token not found in config')
      }

      this.client = new WebClient(token)
    }
    return this.client
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.bot_token || typeof config.bot_token !== 'string') {
      return false
    }
    if (!config.bot_token.startsWith('xoxb-')) {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const client = this.getClient()
      const auth = await client.auth.test()
      return auth.ok === true
    } catch (error) {
      console.error('Slack test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.SEND_MESSAGE:
        return this.sendMessage(request.payload)

      case IntegrationAction.GET_CHANNELS:
        return this.getChannels(request.payload)

      case IntegrationAction.GET_USERS:
        return this.getUsers(request.payload)

      case IntegrationAction.POST_THREAD:
        return this.postThread(request.payload)

      case IntegrationAction.REACT_TO_MESSAGE:
        return this.reactToMessage(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Send a message to a Slack channel
   * Payload: { channel: string, text: string, blocks?: any[] }
   */
  private async sendMessage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { channel, text, blocks } = payload

      if (!channel) throw new Error('Channel is required')
      if (!text && !blocks) throw new Error('Text or blocks are required')

      const client = this.getClient()
      const result = await client.chat.postMessage({
        channel,
        text,
        blocks,
      })

      return {
        channel: result.channel,
        ts: result.ts,
        message_id: result.message_id,
      }
    }, 'send_message')
  }

  /**
   * List channels
   */
  private async getChannels(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { limit = 100, exclude_archived = true } = payload

      const client = this.getClient()
      const result = await client.conversations.list({
        limit,
        exclude_archived,
      })

      return result.channels?.map((ch) => ({
        id: ch.id,
        name: ch.name,
        is_private: ch.is_private,
        is_member: ch.is_member,
      }))
    }, 'get_channels')
  }

  /**
   * List users
   */
  private async getUsers(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { limit = 100 } = payload

      const client = this.getClient()
      const result = await client.users.list({
        limit,
      })

      return result.members?.map((user) => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        is_bot: user.is_bot,
      }))
    }, 'get_users')
  }

  /**
   * Post message in a thread
   * Payload: { channel: string, thread_ts: string, text: string }
   */
  private async postThread(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { channel, thread_ts, text } = payload

      if (!channel) throw new Error('Channel is required')
      if (!thread_ts) throw new Error('Thread timestamp is required')
      if (!text) throw new Error('Text is required')

      const client = this.getClient()
      const result = await client.chat.postMessage({
        channel,
        thread_ts,
        text,
      })

      return {
        channel: result.channel,
        ts: result.ts,
        thread_ts: result.message.thread_ts,
      }
    }, 'post_thread')
  }

  /**
   * React to a message
   * Payload: { channel: string, timestamp: string, emoji: string }
   */
  private async reactToMessage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { channel, timestamp, emoji } = payload

      if (!channel) throw new Error('Channel is required')
      if (!timestamp) throw new Error('Timestamp is required')
      if (!emoji) throw new Error('Emoji is required')

      const client = this.getClient()
      await client.reactions.add({
        channel,
        timestamp,
        name: emoji,
      })

      return { success: true }
    }, 'react_to_message')
  }
}
