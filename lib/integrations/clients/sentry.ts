/**
 * Sentry integration client
 * Handles: get_issues, get_issue_details, mark_issue_resolved
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

export class SentryClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('sentry', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.sentry_token || typeof config.sentry_token !== 'string') {
      return false
    }
    if (!config.organization) {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const config = this.getConfig()
      const response = await fetch(`https://sentry.io/api/0/organizations/${config.organization}/`, {
        headers: {
          Authorization: `Bearer ${config.sentry_token}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error('Sentry test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.GET_ISSUES:
        return this.getIssues(request.payload)

      case IntegrationAction.GET_ISSUE_DETAILS:
        return this.getIssueDetails(request.payload)

      case IntegrationAction.MARK_ISSUE_RESOLVED:
        return this.markIssueResolved(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Get issues from Sentry
   * Payload: { project?: string, limit?: number }
   */
  private async getIssues(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { project, limit = 50 } = payload

      let url = `https://sentry.io/api/0/organizations/${config.organization}/issues/`
      if (project) {
        url = `https://sentry.io/api/0/projects/${config.organization}/${project}/issues/`
      }

      const response = await fetch(`${url}?limit=${Math.min(limit, 100)}`, {
        headers: {
          Authorization: `Bearer ${config.sentry_token}`,
        },
      })

      if (!response.ok) throw new Error(`Sentry API error: ${response.status}`)

      const issues = await response.json()

      return issues.map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        status: issue.status,
        level: issue.level,
        lastSeen: issue.lastSeen,
        firstSeen: issue.firstSeen,
        count: issue.count,
      }))
    }, 'get_issues')
  }

  /**
   * Get issue details
   * Payload: { project: string, issue_id: string }
   */
  private async getIssueDetails(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { project, issue_id } = payload

      if (!project || !issue_id) throw new Error('Project and issue_id are required')

      const url = `https://sentry.io/api/0/projects/${config.organization}/${project}/issues/${issue_id}/`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.sentry_token}`,
        },
      })

      if (!response.ok) throw new Error(`Sentry API error: ${response.status}`)

      const issue = await response.json()

      return {
        id: issue.id,
        title: issue.title,
        status: issue.status,
        level: issue.level,
        count: issue.count,
        lastSeen: issue.lastSeen,
        firstSeen: issue.firstSeen,
        shortURL: issue.shortURL,
      }
    }, 'get_issue_details')
  }

  /**
   * Mark issue as resolved
   * Payload: { project: string, issue_id: string }
   */
  private async markIssueResolved(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { project, issue_id } = payload

      if (!project || !issue_id) throw new Error('Project and issue_id are required')

      const url = `https://sentry.io/api/0/projects/${config.organization}/${project}/issues/${issue_id}/`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.sentry_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' }),
      })

      if (!response.ok) throw new Error(`Sentry API error: ${response.status}`)

      return { success: true }
    }, 'mark_issue_resolved')
  }
}
