'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Check, AlertCircle, Loader } from 'lucide-react'

interface InvitationData {
  teamId: string
  teamName: string
}

export default function InviteAcceptPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')
  const [message, setMessage] = useState('')
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)

  useEffect(() => {
    // Optionally, you could fetch invitation details here
    // For now, we'll just accept on button click
  }, [token])

  const handleAccept = async () => {
    setLoading(true)
    setStatus('loading')
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        setInvitationData({
          teamId: data.teamId,
          teamName: data.teamName,
        })
        setStatus('success')
        setMessage('Invitation accepted successfully!')

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        const error = await response.json()
        setStatus('error')
        setMessage(error.error || 'Failed to accept invitation')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-teal-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              {status === 'success' ? (
                <Check className="w-8 h-8 text-white" />
              ) : status === 'error' ? (
                <AlertCircle className="w-8 h-8 text-white" />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded-lg" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Team Invitation</h1>
            <p className="text-muted-foreground">You've been invited to join a team</p>
          </div>

          {/* Content */}
          {status === 'idle' || status === 'loading' ? (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Accepting invitation for:</p>
                <p className="text-lg font-semibold text-foreground">{invitationData?.teamName || 'Your Team'}</p>
              </div>

              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Accepting...' : 'Accept Invitation'}
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <p className="text-green-700 dark:text-green-300 font-medium">{message}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-300 font-medium">{message}</p>
              </div>

              <button
                onClick={() => {
                  setStatus('idle')
                  setMessage('')
                }}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium"
              >
                Try Again
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          ) : null}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Having trouble? Contact your team administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
