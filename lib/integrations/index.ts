/**
 * Integration layer exports
 * All integration clients and services are available here
 */

export { IntegrationService } from './service'
export {
  IntegrationExecutionRequest,
  IntegrationExecutionResponse,
  ExecutionContext,
  IntegrationAction,
  ProviderClient,
} from './types'

// Export individual clients
export { SlackClient } from './clients/slack'
export { GitHubClient } from './clients/github'
export { SentryClient } from './clients/sentry'
export { LinearClient } from './clients/linear'
export { VercelClient } from './clients/vercel'
export { NotionClient } from './clients/notion'
export { GmailClient } from './clients/gmail'
export { HubSpotClient } from './clients/hubspot'
export { WhatsAppClient } from './clients/whatsapp'
export { TelegramClient } from './clients/telegram'

// Export base class
export { BaseIntegrationClient } from './base'
