'use client'

import { useEffect, useState } from 'react'
import { Check, ExternalLink, RefreshCw, Settings, Wifi, WifiOff, Zap } from 'lucide-react'
import IntegrationWizard from '@/components/IntegrationWizard'
import { INTEGRATION_CONFIGS } from '@/lib/integration-configs'
import { authHeaders } from '@/lib/fetch-auth'

interface DBIntegration {
  id: string
  provider: string
  status: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Integration {
  id: string
  name: string
  icon: string
  description: string
  status: 'connected' | 'disconnected' | 'error'
  category: 'communication' | 'development' | 'crm' | 'monitoring' | 'productivity'
  eventsToday: number
  lastSync: string
  channels?: string[]
}

// Map all 10 services
const SERVICE_CONFIGS = [
  { id: 'slack', name: 'Slack', icon: '💬', category: 'communication' },
  { id: 'github', name: 'GitHub', icon: '🐙', category: 'development' },
  { id: 'sentry', name: 'Sentry', icon: '🛡️', category: 'monitoring' },
  { id: 'linear', name: 'Linear', icon: '📋', category: 'productivity' },
  { id: 'hubspot', name: 'HubSpot', icon: '🔶', category: 'crm' },
  { id: 'gmail', name: 'Gmail', icon: '📧', category: 'communication' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', category: 'communication' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', category: 'communication' },
  { id: 'notion', name: 'Notion', icon: '📝', category: 'productivity' },
  { id: 'vercel', name: 'Vercel', icon: '▲', category: 'development' },
]

const statusConfig = {
  connected: { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Connected' },
  disconnected: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300', label: 'Not Connected' },
  error: { color: 'text-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Error' },
  CONNECTED: { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Connected' },
  DISCONNECTED: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300', label: 'Not Connected' },
  ERROR: { color: 'text-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Error' },
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'communication', label: 'Communication' },
  { id: 'development', label: 'Development' },
  { id: 'crm', label: 'CRM' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'productivity', label: 'Productivity' },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [wizardId, setWizardId] = useState<string | null>(null)

  // Load integrations from API
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations', {
          headers: authHeaders(),
        })
        if (!response.ok) throw new Error('Failed to fetch')

        const dbIntegrations: DBIntegration[] = await response.json()
        const dbMap = new Map(dbIntegrations.map(i => [i.provider, i]))

        // Build integration list from service configs
        const integrationsList = SERVICE_CONFIGS.map(service => {
          const config = INTEGRATION_CONFIGS[service.id]
          const dbIntegration = dbMap.get(service.id)
          const dbStatus = dbIntegration?.status.toLowerCase() as 'connected' | 'disconnected' | 'error' | undefined

          return {
            id: service.id,
            name: service.name,
            icon: service.icon,
            description: config?.description || '',
            status: dbStatus || 'disconnected',
            category: service.category as any,
            eventsToday: 0,
            lastSync: dbIntegration ? 'Just now' : 'Never',
            channels: dbIntegration?.metadata?.channels || [],
          }
        })

        setIntegrations(integrationsList)
      } catch (error) {
        console.error('Failed to load integrations:', error)
        // Fall back to empty list
        setIntegrations(
          SERVICE_CONFIGS.map(service => ({
            id: service.id,
            name: service.name,
            icon: service.icon,
            description: INTEGRATION_CONFIGS[service.id]?.description || '',
            status: 'disconnected',
            category: service.category as any,
            eventsToday: 0,
            lastSync: 'Never',
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    loadIntegrations()
  }, [])

  const filtered = activeCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === activeCategory)

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const totalEvents = integrations.reduce((sum, i) => sum + i.eventsToday, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
            <p className="text-muted-foreground">Connect your tools and let AI employees monitor everything</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-purple-500" />
              <p className="text-sm text-purple-600 font-medium">Connected</p>
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">{connectedCount} / {integrations.length}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-500" />
              <p className="text-sm text-teal-600 font-medium">Events Today</p>
            </div>
            <p className="text-2xl font-bold text-teal-700 mt-1">{totalEvents.toLocaleString()}</p>
          </div>
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-sky-500" />
              <p className="text-sm text-sky-600 font-medium">Status</p>
            </div>
            <p className="text-2xl font-bold text-sky-700 mt-1">All Systems Live</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-8 py-4 border-b border-border bg-card/50 flex items-center gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading integrations...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(integration => {
            const config = statusConfig[integration.status]
            return (
              <div
                key={integration.id}
                className={`bg-card border rounded-xl p-6 hover:shadow-md transition-all ${
                  integration.status === 'connected' ? 'border-border' : 'border-dashed border-border/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-lg">{integration.name}</h3>
                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{integration.description}</p>
                    </div>
                  </div>
                </div>

                {integration.status === 'connected' ? (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">{integration.eventsToday}</strong> events today
                        </span>
                        <span className="text-muted-foreground">
                          Synced <strong className="text-foreground">{integration.lastSync}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => setWizardId(integration.id)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    {integration.channels && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {integration.channels.map(ch => (
                          <span key={ch} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <button
                      onClick={() => setWizardId(integration.id)}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Connect {integration.name}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
            </div>
        )}
      </div>

      {/* Integration Wizard Modal */}
      {wizardId && (
        <IntegrationWizard
          integrationId={wizardId}
          onClose={() => setWizardId(null)}
          onConnected={() => {
            setWizardId(null)
            // Reload integrations
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
