/**
 * Notion integration client
 * Handles: create_page, update_page, query_database, get_page
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

const NOTION_API = 'https://api.notion.com/v1'

export class NotionClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('notion', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.notion_token || typeof config.notion_token !== 'string') {
      return false
    }
    if (!config.notion_token.startsWith('secret_')) {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const config = this.getConfig()
      const response = await fetch(`${NOTION_API}/users/me`, {
        headers: {
          Authorization: `Bearer ${config.notion_token}`,
          'Notion-Version': '2022-06-28',
        },
      })
      return response.ok
    } catch (error) {
      console.error('Notion test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.CREATE_PAGE:
        return this.createPage(request.payload)

      case IntegrationAction.UPDATE_PAGE:
        return this.updatePage(request.payload)

      case IntegrationAction.QUERY_DATABASE:
        return this.queryDatabase(request.payload)

      case IntegrationAction.GET_PAGE:
        return this.getPage(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Create a page in Notion
   * Payload: { parentId: string, title: string, content?: string }
   */
  private async createPage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { parentId, title, content } = payload

      if (!parentId || !title) throw new Error('Parent ID and title are required')

      const response = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.notion_token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: parentId },
          properties: {
            title: {
              title: [{ text: { content: title } }],
            },
          },
          ...(content && {
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  text: [{ text: { content } }],
                },
              },
            ],
          }),
        }),
      })

      if (!response.ok) throw new Error(`Notion API error: ${response.status}`)

      const page = await response.json()

      return {
        id: page.id,
        url: page.public_url,
        title,
      }
    }, 'create_page')
  }

  /**
   * Update a page
   * Payload: { pageId: string, properties: Record<string, any> }
   */
  private async updatePage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { pageId, properties } = payload

      if (!pageId || !properties) throw new Error('Page ID and properties are required')

      const response = await fetch(`${NOTION_API}/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${config.notion_token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })

      if (!response.ok) throw new Error(`Notion API error: ${response.status}`)

      return { success: true }
    }, 'update_page')
  }

  /**
   * Query a database
   * Payload: { databaseId: string, filter?: Record<string, any> }
   */
  private async queryDatabase(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { databaseId, filter } = payload

      if (!databaseId) throw new Error('Database ID is required')

      const response = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.notion_token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(filter && { filter }),
        }),
      })

      if (!response.ok) throw new Error(`Notion API error: ${response.status}`)

      const data = await response.json()

      return data.results?.map((page: any) => ({
        id: page.id,
        url: page.public_url,
        properties: page.properties,
      }))
    }, 'query_database')
  }

  /**
   * Get page details
   * Payload: { pageId: string }
   */
  private async getPage(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { pageId } = payload

      if (!pageId) throw new Error('Page ID is required')

      const response = await fetch(`${NOTION_API}/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${config.notion_token}`,
          'Notion-Version': '2022-06-28',
        },
      })

      if (!response.ok) throw new Error(`Notion API error: ${response.status}`)

      const page = await response.json()

      return {
        id: page.id,
        url: page.public_url,
        properties: page.properties,
        lastEditedTime: page.last_edited_time,
      }
    }, 'get_page')
  }
}
