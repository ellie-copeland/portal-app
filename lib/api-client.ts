'use client'

/**
 * API Client Utility
 * Handles all HTTP requests with authentication headers
 */

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('accessToken')
  } catch {
    return null
  }
}

const getActiveTeamId = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('activeTeamId')
  } catch {
    return null
  }
}

const getHeaders = (token: string | null = null): HeadersInit => {
  const accessToken = token || getAccessToken()
  const teamId = getActiveTeamId()
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    ...(teamId && { 'X-Team-Id': teamId }),
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number
}

const fetchWithTimeout = async (url: string, options: FetchOptions = {}) => {
  const { timeout = 30000, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export const apiClient = {
  async get<T>(url: string, token?: string): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async post<T>(url: string, data?: Record<string, any>, token?: string): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: getHeaders(token),
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      let detail = ''
      try { const body = await response.json(); detail = body.error || JSON.stringify(body) } catch {}
      throw new Error(`API Error: ${response.status}${detail ? ` — ${detail}` : ''}`)
    }

    return response.json()
  },

  async put<T>(url: string, data?: Record<string, any>, token?: string): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: getHeaders(token),
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async delete<T>(url: string, token?: string): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: getHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },
}
