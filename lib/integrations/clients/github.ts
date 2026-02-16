/**
 * GitHub integration client
 * Handles: create_issue, create_pr_comment, list_prs, list_issues, update_pr
 */

import { Octokit } from '@octokit/rest'
import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

export class GitHubClient extends BaseIntegrationClient {
  private client: Octokit | null = null

  constructor(encryptedConfig: string) {
    super('github', encryptedConfig)
  }

  /**
   * Get authenticated GitHub client
   */
  private getClient(): Octokit {
    if (!this.client) {
      const config = this.getConfig()
      const token = config.github_token

      if (!token) {
        throw new Error('GitHub token not found in config')
      }

      this.client = new Octokit({
        auth: token,
      })
    }
    return this.client
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.github_token || typeof config.github_token !== 'string') {
      return false
    }
    if (!config.github_token.startsWith('ghp_') && !config.github_token.startsWith('github_pat_')) {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const client = this.getClient()
      const { data } = await client.users.getAuthenticated()
      return !!data.login
    } catch (error) {
      console.error('GitHub test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.CREATE_ISSUE:
        return this.createIssue(request.payload)

      case IntegrationAction.CREATE_PR_COMMENT:
        return this.createPRComment(request.payload)

      case IntegrationAction.LIST_PRS:
        return this.listPRs(request.payload)

      case IntegrationAction.LIST_ISSUES:
        return this.listIssues(request.payload)

      case IntegrationAction.UPDATE_PR:
        return this.updatePR(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Create a GitHub issue
   * Payload: { owner: string, repo: string, title: string, body: string, labels?: string[] }
   */
  private async createIssue(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { owner, repo, title, body, labels } = payload

      if (!owner || !repo || !title) throw new Error('Owner, repo, and title are required')

      const client = this.getClient()
      const { data } = await client.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
      })

      return {
        id: data.id,
        number: data.number,
        url: data.html_url,
        title: data.title,
      }
    }, 'create_issue')
  }

  /**
   * Create a PR comment
   * Payload: { owner: string, repo: string, pull_number: number, body: string }
   */
  private async createPRComment(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { owner, repo, pull_number, body } = payload

      if (!owner || !repo || !pull_number || !body) {
        throw new Error('Owner, repo, pull_number, and body are required')
      }

      const client = this.getClient()
      const { data } = await client.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body,
      })

      return {
        id: data.id,
        url: data.html_url,
        body: data.body,
      }
    }, 'create_pr_comment')
  }

  /**
   * List pull requests
   * Payload: { owner: string, repo: string, state?: 'open' | 'closed' | 'all', limit?: number }
   */
  private async listPRs(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { owner, repo, state = 'open', limit = 30 } = payload

      if (!owner || !repo) throw new Error('Owner and repo are required')

      const client = this.getClient()
      const { data } = await client.pulls.list({
        owner,
        repo,
        state: state as any,
        per_page: Math.min(limit, 100),
      })

      return data.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
        author: pr.user?.login,
      }))
    }, 'list_prs')
  }

  /**
   * List issues
   * Payload: { owner: string, repo: string, state?: 'open' | 'closed' | 'all', limit?: number }
   */
  private async listIssues(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { owner, repo, state = 'open', limit = 30 } = payload

      if (!owner || !repo) throw new Error('Owner and repo are required')

      const client = this.getClient()
      const { data } = await client.issues.listForRepo({
        owner,
        repo,
        state: state as any,
        per_page: Math.min(limit, 100),
      })

      return data.map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        author: issue.user?.login,
      }))
    }, 'list_issues')
  }

  /**
   * Update a pull request
   * Payload: { owner: string, repo: string, pull_number: number, state?: string, title?: string }
   */
  private async updatePR(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { owner, repo, pull_number, state, title } = payload

      if (!owner || !repo || !pull_number) {
        throw new Error('Owner, repo, and pull_number are required')
      }

      const client = this.getClient()
      const { data } = await client.pulls.update({
        owner,
        repo,
        pull_number,
        ...(state && { state }),
        ...(title && { title }),
      })

      return {
        id: data.id,
        number: data.number,
        state: data.state,
        url: data.html_url,
      }
    }, 'update_pr')
  }
}
