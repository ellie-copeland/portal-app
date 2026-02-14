/**
 * Shared utility for getting auth headers with access token
 * Ensures all client-side fetch calls include proper Authorization headers
 */
export function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const teamId = typeof window !== 'undefined' ? localStorage.getItem('activeTeamId') : null
  if (teamId) {
    headers['X-Team-Id'] = teamId
  }
  return headers
}
