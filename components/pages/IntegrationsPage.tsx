'use client'

import { useState } from 'react'
import { Check, ExternalLink, RefreshCw, Settings, Wifi, WifiOff, Zap } from 'lucide-react'

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

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Monitor channels, respond to mentions, and send proactive alerts',
    status: 'connected',
    category: 'communication',
    eventsToday: 247,
    lastSync: '30s ago',
    channels: ['#support', '#engineering', '#sales', '#general'],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Review PRs, monitor commits, track issues, and automate workflows',
    status: 'connected',
    category: 'development',
    eventsToday: 83,
    lastSync: '2 min ago',
    channels: ['assistable-v2', 'a2p-wizard', 'tensol-v2'],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    icon: '🛡️',
    description: 'Monitor errors, correlate with deployments, and alert on-call engineers',
    status: 'connected',
    category: 'monitoring',
    eventsToday: 12,
    lastSync: '1 min ago',
    channels: ['assistable-prod', 'tensol-prod'],
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: '📋',
    description: 'Track issues, create tickets from alerts, and sync project status',
    status: 'connected',
    category: 'productivity',
    eventsToday: 34,
    lastSync: '5 min ago',
    channels: ['Engineering', 'Product'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🔶',
    description: 'Auto-log calls, update deal stages, and track customer interactions',
    status: 'connected',
    category: 'crm',
    eventsToday: 56,
    lastSync: '3 min ago',
    channels: ['142 active deals'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    description: 'Monitor inboxes, draft responses, and flag urgent emails',
    status: 'connected',
    category: 'communication',
    eventsToday: 89,
    lastSync: '1 min ago',
    channels: ['3 inboxes monitored'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '📱',
    description: 'Chat with AI employees directly via WhatsApp Business',
    status: 'disconnected',
    category: 'communication',
    eventsToday: 0,
    lastSync: 'Never',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    description: 'Receive alerts and chat with agents via Telegram bot',
    status: 'disconnected',
    category: 'communication',
    eventsToday: 0,
    lastSync: 'Never',
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Sync knowledge base, create pages from conversations, and track docs',
    status: 'disconnected',
    category: 'productivity',
    eventsToday: 0,
    lastSync: 'Never',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    description: 'Monitor deployments, track build status, and correlate with errors',
    status: 'connected',
    category: 'development',
    eventsToday: 7,
    lastSync: '10 min ago',
  },
]

const statusConfig = {
  connected: { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Connected' },
  disconnected: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300', label: 'Not Connected' },
  error: { color: 'text-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Error' },
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
  const [integrations] = useState<Integration[]>(MOCK_INTEGRATIONS)
  const [activeCategory, setActiveCategory] = useState('all')

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
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
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
                    <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Connect {integration.name}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
