/**
 * Integration execution layer types
 * Shared types for all provider clients
 */

export interface IntegrationExecutionRequest {
  action: IntegrationAction
  payload: Record<string, any>
  context?: ExecutionContext
}

export interface IntegrationExecutionResponse {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    executionTime?: number
    provider?: string
    action?: string
  }
}

export interface ExecutionContext {
  userId?: string
  teamId?: string
  agentId?: string
  approvalRequired?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export enum IntegrationAction {
  // Slack
  SEND_MESSAGE = 'slack:send_message',
  GET_CHANNELS = 'slack:get_channels',
  GET_USERS = 'slack:get_users',
  POST_THREAD = 'slack:post_thread',
  REACT_TO_MESSAGE = 'slack:react_to_message',

  // GitHub
  CREATE_ISSUE = 'github:create_issue',
  CREATE_PR_COMMENT = 'github:create_pr_comment',
  LIST_PRS = 'github:list_prs',
  LIST_ISSUES = 'github:list_issues',
  UPDATE_PR = 'github:update_pr',

  // Sentry
  GET_ISSUES = 'sentry:get_issues',
  GET_ISSUE_DETAILS = 'sentry:get_issue_details',
  MARK_ISSUE_RESOLVED = 'sentry:mark_issue_resolved',

  // Linear
  CREATE_ISSUE_LINEAR = 'linear:create_issue',
  UPDATE_ISSUE = 'linear:update_issue',
  LIST_ISSUES_LINEAR = 'linear:list_issues',
  ADD_COMMENT = 'linear:add_comment',

  // Vercel
  GET_DEPLOYMENTS = 'vercel:get_deployments',
  GET_PROJECT = 'vercel:get_project',
  REVERT_DEPLOYMENT = 'vercel:revert_deployment',

  // Notion
  CREATE_PAGE = 'notion:create_page',
  UPDATE_PAGE = 'notion:update_page',
  QUERY_DATABASE = 'notion:query_database',
  GET_PAGE = 'notion:get_page',

  // Gmail
  DRAFT_REPLY = 'gmail:draft_reply',
  LIST_THREADS = 'gmail:list_threads',
  GET_MESSAGE = 'gmail:get_message',
  SEND_REPLY = 'gmail:send_reply',

  // HubSpot
  CREATE_CONTACT = 'hubspot:create_contact',
  UPDATE_CONTACT = 'hubspot:update_contact',
  GET_CONTACT = 'hubspot:get_contact',
  CREATE_DEAL = 'hubspot:create_deal',
  UPDATE_DEAL = 'hubspot:update_deal',

  // WhatsApp
  SEND_WHATSAPP_MESSAGE = 'whatsapp:send_message',
  GET_WHATSAPP_MESSAGES = 'whatsapp:get_messages',

  // Telegram
  SEND_TELEGRAM_MESSAGE = 'telegram:send_message',
  GET_TELEGRAM_UPDATES = 'telegram:get_updates',
}

export interface ProviderClient {
  execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse>
  validate(config: Record<string, any>): Promise<boolean>
  test(): Promise<boolean>
}
