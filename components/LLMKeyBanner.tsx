'use client'

import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'

interface LLMKeyBannerProps {
  onAddKey: () => void
}

export default function LLMKeyBanner({ onAddKey }: LLMKeyBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [hasKeys, setHasKeys] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if banner has been dismissed in localStorage
    const isDismissed = localStorage.getItem('llm-key-banner-dismissed') === 'true'
    if (isDismissed) {
      setDismissed(true)
    }

    // Fetch keys to check if user has any
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys')
      if (res.ok) {
        const data = await res.json()
        setHasKeys(data.keys && data.keys.length > 0)
      }
    } catch (error) {
      console.error('Error fetching keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('llm-key-banner-dismissed', 'true')
  }

  const handleAddKey = () => {
    // Clear dismiss state so it can show again if user navigates away
    localStorage.removeItem('llm-key-banner-dismissed')
    onAddKey()
  }

  // Don't show if loading, dismissed, or user has keys
  if (loading || dismissed || hasKeys) {
    return null
  }

  return (
    <div className="mx-6 sm:mx-8 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Set up your AI</p>
          <p className="text-xs text-muted-foreground">Add an API key to start chatting with your agents</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <button
          onClick={handleAddKey}
          className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors whitespace-nowrap"
        >
          Add API Key
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-purple-200/50 dark:hover:bg-purple-900/30 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
