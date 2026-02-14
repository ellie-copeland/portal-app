'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Trash2, Plus, ExternalLink } from 'lucide-react'

interface StoredKey {
  id: string
  provider: 'openrouter' | 'anthropic' | 'openai'
  keyPrefix: string
  label?: string
  createdAt: string
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

const PROVIDER_CONFIG = {
  openrouter: {
    label: 'OpenRouter',
    helpText: 'Get your key at',
    url: 'https://openrouter.ai/keys',
  },
  anthropic: {
    label: 'Anthropic',
    helpText: 'Get your key at',
    url: 'https://console.anthropic.com',
  },
  openai: {
    label: 'OpenAI',
    helpText: 'Get your key at',
    url: 'https://platform.openai.com/api-keys',
  },
}

export default function LLMKeyManager() {
  const [keys, setKeys] = useState<StoredKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Form state
  const [provider, setProvider] = useState<'openrouter' | 'anthropic' | 'openai'>('openrouter')
  const [keyValue, setKeyValue] = useState('')
  const [label, setLabel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch keys on mount
  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/keys')
      if (!res.ok) throw new Error('Failed to fetch keys')
      const data = await res.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error('Error fetching keys:', error)
      showToast('Failed to load API keys', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyValue.trim()) {
      showToast('Please enter an API key', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          key: keyValue,
          label: label || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.key?.[0] || 'Failed to save API key')
      }

      showToast(`${PROVIDER_CONFIG[provider].label} API key saved successfully!`, 'success')
      setKeyValue('')
      setLabel('')
      setShowAddForm(false)
      await fetchKeys()
    } catch (error) {
      console.error('Error saving key:', error)
      showToast(error instanceof Error ? error.message : 'Failed to save API key', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete key')

      showToast('API key deleted successfully', 'success')
      await fetchKeys()
    } catch (error) {
      console.error('Error deleting key:', error)
      showToast('Failed to delete API key', 'error')
    }
  }

  const maskKeyPrefix = (prefix: string) => {
    if (!prefix) return '••••••••'
    return `${prefix}••••`
  }

  return (
    <div className="space-y-6">
      {/* Stored Keys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-500" />
            Stored API Keys
          </h3>
          {keys.length > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">
              {keys.length} key{keys.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">No API keys stored yet</p>
            <p className="text-xs text-muted-foreground">Add your first API key to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50 hover:border-border transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {PROVIDER_CONFIG[k.provider].label}
                    {k.label && <span className="text-xs text-muted-foreground ml-2">— {k.label}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{maskKeyPrefix(k.keyPrefix)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Added {new Date(k.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="flex-shrink-0 p-2.5 rounded-lg hover:bg-destructive/10 transition-colors ml-3"
                  title="Delete key"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Key Form */}
      {showAddForm ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-500" />
            Add New API Key
          </h3>

          <form onSubmit={handleSaveKey} className="space-y-4">
            {/* Provider Dropdown */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Provider</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as 'openrouter' | 'anthropic' | 'openai')}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="openrouter">{PROVIDER_CONFIG.openrouter.label}</option>
                <option value="anthropic">{PROVIDER_CONFIG.anthropic.label}</option>
                <option value="openai">{PROVIDER_CONFIG.openai.label}</option>
              </select>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 flex items-start gap-2">
              <div className="text-xs text-blue-700 dark:text-blue-400 flex-1">
                <p className="font-medium mb-1">{PROVIDER_CONFIG[provider].helpText}</p>
                <a
                  href={PROVIDER_CONFIG[provider].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  {PROVIDER_CONFIG[provider].url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyValue}
                  onChange={e => setKeyValue(e.target.value)}
                  placeholder="Paste your API key here"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Label Input */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g., Production, Testing"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-all text-sm"
              >
                {saving ? 'Saving...' : 'Save API Key'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setKeyValue('')
                  setLabel('')
                  setShowKey(false)
                }}
                className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-3 border border-dashed border-border rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add API Key
        </button>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl text-sm font-medium pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
