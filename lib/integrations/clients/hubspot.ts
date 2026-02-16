/**
 * HubSpot integration client
 * Handles: create_contact, update_contact, get_contact, create_deal, update_deal
 */

import { BaseIntegrationClient } from '../base'
import { IntegrationAction, IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

const HUBSPOT_API = 'https://api.hubapi.com'

export class HubSpotClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('hubspot', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.hubspot_token || typeof config.hubspot_token !== 'string') {
      return false
    }
    return true
  }

  async test(): Promise<boolean> {
    try {
      const config = this.getConfig()
      const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
        headers: {
          Authorization: `Bearer ${config.hubspot_token}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error('HubSpot test failed:', error)
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case IntegrationAction.CREATE_CONTACT:
        return this.createContact(request.payload)

      case IntegrationAction.UPDATE_CONTACT:
        return this.updateContact(request.payload)

      case IntegrationAction.GET_CONTACT:
        return this.getContact(request.payload)

      case IntegrationAction.CREATE_DEAL:
        return this.createDeal(request.payload)

      case IntegrationAction.UPDATE_DEAL:
        return this.updateDeal(request.payload)

      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  /**
   * Create a contact
   * Payload: { email: string, firstname?: string, lastname?: string, phone?: string }
   */
  private async createContact(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { email, firstname, lastname, phone } = payload

      if (!email) throw new Error('Email is required')

      const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.hubspot_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            email,
            firstname: firstname || '',
            lastname: lastname || '',
            phone: phone || '',
          },
        }),
      })

      if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`)

      const contact = await response.json()

      return {
        id: contact.id,
        email,
      }
    }, 'create_contact')
  }

  /**
   * Update a contact
   * Payload: { contactId: string, firstname?: string, lastname?: string, phone?: string }
   */
  private async updateContact(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { contactId, firstname, lastname, phone } = payload

      if (!contactId) throw new Error('Contact ID is required')

      const properties: Record<string, any> = {}
      if (firstname) properties.firstname = firstname
      if (lastname) properties.lastname = lastname
      if (phone) properties.phone = phone

      if (Object.keys(properties).length === 0) {
        throw new Error('At least one property to update is required')
      }

      const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${config.hubspot_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })

      if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`)

      return { success: true }
    }, 'update_contact')
  }

  /**
   * Get contact details
   * Payload: { contactId: string }
   */
  private async getContact(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { contactId } = payload

      if (!contactId) throw new Error('Contact ID is required')

      const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${config.hubspot_token}`,
        },
      })

      if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`)

      const contact = await response.json()

      return {
        id: contact.id,
        properties: contact.properties,
      }
    }, 'get_contact')
  }

  /**
   * Create a deal
   * Payload: { dealname: string, amount?: number, dealstage?: string }
   */
  private async createDeal(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { dealname, amount, dealstage } = payload

      if (!dealname) throw new Error('Deal name is required')

      const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.hubspot_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            dealname,
            amount: amount || 0,
            dealstage: dealstage || 'negotiation',
          },
        }),
      })

      if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`)

      const deal = await response.json()

      return {
        id: deal.id,
        dealname,
      }
    }, 'create_deal')
  }

  /**
   * Update a deal
   * Payload: { dealId: string, dealstage?: string, amount?: number }
   */
  private async updateDeal(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      const config = this.getConfig()
      const { dealId, dealstage, amount } = payload

      if (!dealId) throw new Error('Deal ID is required')

      const properties: Record<string, any> = {}
      if (dealstage) properties.dealstage = dealstage
      if (amount) properties.amount = amount

      if (Object.keys(properties).length === 0) {
        throw new Error('At least one property to update is required')
      }

      const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${config.hubspot_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })

      if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`)

      return { success: true }
    }, 'update_deal')
  }
}
