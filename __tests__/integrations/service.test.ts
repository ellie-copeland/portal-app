/**
 * Integration Service Tests
 */

import { IntegrationService } from '@/lib/integrations/service'
import { SlackClient } from '@/lib/integrations/clients/slack'
import { GitHubClient } from '@/lib/integrations/clients/github'

describe('IntegrationService', () => {
  describe('getClient', () => {
    it('should return SlackClient for slack provider', () => {
      const client = IntegrationService.getClient('slack', 'encrypted_config')
      expect(client).toBeInstanceOf(SlackClient)
    })

    it('should return GitHubClient for github provider', () => {
      const client = IntegrationService.getClient('github', 'encrypted_config')
      expect(client).toBeInstanceOf(GitHubClient)
    })

    it('should throw for unknown provider', () => {
      expect(() => {
        IntegrationService.getClient('unknown-provider', 'config')
      }).toThrow('Unknown provider')
    })

    it('should handle case-insensitive provider names', () => {
      const client = IntegrationService.getClient('SLACK', 'encrypted_config')
      expect(client).toBeInstanceOf(SlackClient)
    })
  })

  describe('validateConfig', () => {
    it('should validate correct Slack config', async () => {
      const result = await IntegrationService.validateConfig('slack', {
        bot_token: 'xoxb-valid-token',
      })
      expect(result).toBe(true)
    })

    it('should reject invalid config', async () => {
      const result = await IntegrationService.validateConfig('slack', {
        bot_token: 'invalid',
      })
      expect(result).toBe(false)
    })
  })
})
