/**
 * Linear integration client
 * Handles: create_issue, update_issue, list_issues, add_comment
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

const LINEAR_API = 'https://api.linear.app/graphql'

export class LinearClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('linear', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.linear_token || typeof config.linear_token !== 'string') {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const result = await this.graphql(`
        query {
          viewer {
            id
          }
        }
      `)
      return !!result.data?.viewer?.id
    } catch (error) {
      console.error('Linear test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.CREATE_ISSUE_LINEAR:
        return this.createIssue(request.payload)

      case IntegrationAction.UPDATE_ISSUE:
        return this.updateIssue(request.payload)

      case IntegrationAction.LIST_ISSUES_LINEAR:
        return this.listIssues(request.payload)

      case IntegrationAction.ADD_COMMENT:
        return this.addComment(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * GraphQL query helper
   */
  private async graphql(query: string, variables?: Record<string, any>) {
    const config = this.getConfig()
    const response = await fetch(LINEAR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.linear_token,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }

    return result
  }

  /**
   * Create a Linear issue
   * Payload: { teamId: string, title: string, description?: string, priority?: number }
   */
  private async createIssue(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { teamId, title, description, priority } = payload

      if (!teamId || !title) throw new Error('Team ID and title are required')

      const mutation = `
        mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `

      const result = await this.graphql(mutation, {
        input: {
          teamId,
          title,
          description,
          priority,
        },
      })

      const issue = result.data?.issueCreate?.issue

      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url,
      }
    }, 'create_issue')
  }

  /**
   * Update a Linear issue
   * Payload: { issueId: string, title?: string, description?: string, state?: string }
   */
  private async updateIssue(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { issueId, title, description, state } = payload

      if (!issueId) throw new Error('Issue ID is required')

      const mutation = `
        mutation UpdateIssue($input: IssueUpdateInput!) {
          issueUpdate(id: $issueId, input: $input) {
            issue {
              id
              identifier
              title
              state {
                name
              }
            }
          }
        }
      `

      const result = await this.graphql(mutation, {
        issueId,
        input: {
          ...(title && { title }),
          ...(description && { description }),
          ...(state && { stateId: state }),
        },
      })

      const issue = result.data?.issueUpdate?.issue

      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        state: issue.state?.name,
      }
    }, 'update_issue')
  }

  /**
   * List issues
   * Payload: { teamId: string, limit?: number }
   */
  private async listIssues(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { teamId, limit = 50 } = payload

      if (!teamId) throw new Error('Team ID is required')

      const query = `
        query GetTeamIssues($teamId: ID!, $first: Int!) {
          team(id: $teamId) {
            issues(first: $first) {
              edges {
                node {
                  id
                  identifier
                  title
                  state {
                    name
                  }
                  url
                }
              }
            }
          }
        }
      `

      const result = await this.graphql(query, {
        teamId,
        first: Math.min(limit, 50),
      })

      return result.data?.team?.issues?.edges?.map((edge: any) => ({
        id: edge.node.id,
        identifier: edge.node.identifier,
        title: edge.node.title,
        state: edge.node.state?.name,
        url: edge.node.url,
      }))
    }, 'list_issues')
  }

  /**
   * Add comment to issue
   * Payload: { issueId: string, body: string }
   */
  private async addComment(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const { issueId, body } = payload

      if (!issueId || !body) throw new Error('Issue ID and body are required')

      const mutation = `
        mutation AddComment($input: CommentCreateInput!) {
          commentCreate(input: $input) {
            comment {
              id
              body
              createdAt
            }
          }
        }
      `

      const result = await this.graphql(mutation, {
        input: {
          issueId,
          body,
        },
      })

      const comment = result.data?.commentCreate?.comment

      return {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
      }
    }, 'add_comment')
  }
}
