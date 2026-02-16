/**
 * Slack Integration Tests
 */

import { SlackClient } from '@/lib/integrations/clients/slack'
import { IntegrationAction } from '@/lib/integrations/types'
import { encrypt } from '@/lib/crypto'

describe('SlackClient', () => {
  let client: SlackClient
  let encryptedConfig: string

  beforeAll(() => {
    const config = {
      bot_token: 'xoxb-test-token-12345',
    }
    encryptedConfig = encrypt(JSON.stringify(config))
    client = new SlackClient(encryptedConfig)
  })

  describe('validate', () => {
    it('should validate correct Slack config', async () => {
      const config = {
        bot_token: 'xoxb-valid-token',
      }
      const result = await client.validate(config)
      expect(result).toBe(true)
    })

    it('should reject config without token', async () => {
      const result = await client.validate({})
      expect(result).toBe(false)
    })

    it('should reject config with invalid token format', async () => {
      const result = await client.validate({
        bot_token: 'invalid-token',
      })
      expect(result).toBe(false)
    })
  })

  describe('execute', () => {
    it('should handle unsupported actions', async () => {
      const result = await client.execute({
        action: 'unsupported:action' as any,
        payload: {},
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported action')
    })
  })
})
