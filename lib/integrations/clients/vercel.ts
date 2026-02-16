/**
 * Vercel integration client
 * Handles: get_deployments, get_project, revert_deployment
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

const VERCEL_API = 'https://api.vercel.com'

export class VercelClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('vercel', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.vercel_token || typeof config.vercel_token !== 'string') {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const config = this.getConfig()
      const response = await fetch(`${VERCEL_API}/v1/user`, {
        headers: {
          Authorization: `Bearer ${config.vercel_token}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error('Vercel test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.GET_DEPLOYMENTS:
        return this.getDeployments(request.payload)

      case IntegrationAction.GET_PROJECT:
        return this.getProject(request.payload)

      case IntegrationAction.REVERT_DEPLOYMENT:
        return this.revertDeployment(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Get deployments for a project
   * Payload: { projectId: string, limit?: number }
   */
  private async getDeployments(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { projectId, limit = 50 } = payload

      if (!projectId) throw new Error('Project ID is required')

      const response = await fetch(
        `${VERCEL_API}/v6/deployments?projectId=${projectId}&limit=${Math.min(limit, 100)}`,
        {
          headers: {
            Authorization: `Bearer ${config.vercel_token}`,
          },
        }
      )

      if (!response.ok) throw new Error(`Vercel API error: ${response.status}`)

      const data = await response.json()

      return data.deployments?.map((d: any) => ({
        id: d.id,
        url: d.url,
        name: d.name,
        state: d.state,
        createdAt: d.createdAt,
        creator: d.creator?.username,
      }))
    }, 'get_deployments')
  }

  /**
   * Get project details
   * Payload: { projectId: string }
   */
  private async getProject(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { projectId } = payload

      if (!projectId) throw new Error('Project ID is required')

      const response = await fetch(`${VERCEL_API}/v9/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${config.vercel_token}`,
        },
      })

      if (!response.ok) throw new Error(`Vercel API error: ${response.status}`)

      const project = await response.json()

      return {
        id: project.id,
        name: project.name,
        accountId: project.accountId,
        createdAt: project.createdAt,
        latestDeployments: project.latestDeployments?.length || 0,
      }
    }, 'get_project')
  }

  /**
   * Revert a deployment
   * Payload: { projectId: string, deploymentId: string }
   */
  private async revertDeployment(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { projectId, deploymentId } = payload

      if (!projectId || !deploymentId) {
        throw new Error('Project ID and deployment ID are required')
      }

      const response = await fetch(
        `${VERCEL_API}/v11/projects/${projectId}/deployments/${deploymentId}/promote`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.vercel_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) throw new Error(`Vercel API error: ${response.status}`)

      const result = await response.json()

      return {
        success: true,
        deploymentId: result.id,
      }
    }, 'revert_deployment')
  }
}
