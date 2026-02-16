/**
 * Base integration client - all providers extend this
 */

import { decrypt } from '@/lib/crypto'
import {
  IntegrationExecutionRequest,
  IntegrationExecutionResponse,
  ProviderClient,
} from './types'

export abstract class BaseIntegrationClient implements ProviderClient {
  protected encryptedConfig: string
  protected provider: string

  constructor(provider: string, encryptedConfig: string) {
    this.provider = provider
    this.encryptedConfig = encryptedConfig
  }

  /**
   * Get decrypted config - all providers need this
   */
  protected getConfig(): Record<string, any> {
    try {
      const decrypted = decrypt(this.encryptedConfig)
      return JSON.parse(decrypted)
    } catch (error) {
      console.error(`Failed to decrypt config for ${this.provider}:`, error)
      throw new Error(`Invalid or corrupted config for ${this.provider}`)
    }
  }

  /**
   * Execute integration action - implemented by subclasses
   */
  abstract execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse>

  /**
   * Validate config format - implemented by subclasses
   */
  abstract validate(config: Record<string, any>): Promise<boolean>

  /**
   * Test integration connectivity - implemented by subclasses
   */
  abstract test(): Promise<boolean>

  /**
   * Wrapper for safe execution with error handling
   */
  protected async safeExecute<T>(
    fn: () => Promise<T>,
    action?: string
  ): Promise<IntegrationExecutionResponse> {
    const startTime = Date.now()

    try {
      const data = await fn()
      return {
        success: true,
        data,
        metadata: {
          executionTime: Date.now() - startTime,
          provider: this.provider,
          action,
        },
      }
    } catch (error: any) {
      console.error(`Integration execution error (${this.provider}/${action}):`, error)
      return {
        success: false,
        error: error?.message || 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
          provider: this.provider,
          action,
        },
      }
    }
  }

  /**
   * Rate limit checker (for APIs with rate limits)
   */
  protected async checkRateLimit(endpoint: string): Promise<boolean> {
    // This can be extended for Redis-based rate limiting
    return true
  }

  /**
   * Retry logic for transient failures
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
        }
      }
    }

    throw lastError
  }
}
