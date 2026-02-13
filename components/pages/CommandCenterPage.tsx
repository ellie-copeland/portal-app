'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Activity, Zap, MessageSquare, BarChart3, Gauge, MessageCircle, Bot, Cpu } from 'lucide-react'
import { getAgents, getExecutions, getMetrics, Agent as StoreAgent } from '@/lib/store'

interface Agent {
  agentId: string
  status: 'online' | 'idle' | 'offline'
  lastActivity: number
  activeSessions: number
  totalTokensUsed: number
  model: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface ChatSession {
  sessionId: string
  agentId: string
  messages: ChatMessage[]
  messageCount: number
}

interface CostData {
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costInput: number
  costOutput: number
  totalCost: number
}

interface ActivityLog {
  timestamp: number
  agentId: string
  sessionId: string
  key: string
  kind: string
  tokensUsed: number
  model: string
}

interface HeartbeatAgent {
  agentId: string
  enabled: boolean
  every: string
  everyMs: number | null
}

interface ConversationGroup {
  context: string
  platform: 'imessage' | 'slack' | 'email' | 'other'
  recipient: string
  count: number
  lastTimestamp: number
  lastMessage: string
  preview: string
  messages: Array<{
    sender: string
    content: string
    timestamp: number
  }>
}

type TabType = 'agents' | 'chats' | 'usage' | 'activity' | 'heartbeats' | 'dashboard' | 'conversations'

export default function CommandCenterPage() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard')
  const [agents, setAgents] = useState<Agent[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [usage, setUsage] = useState<CostData[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [conversations, setConversations] = useState<ConversationGroup[]>([])
  const [heartbeat, setHeartbeat] = useState<{ agents: HeartbeatAgent[]; defaultAgentId: string }>({
    agents: [],
    defaultAgentId: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel
        const [agentsRes, sessionsRes, usageRes, conversationsRes] = await Promise.all([
          fetch('/api/command-center/agents'),
          fetch('/api/command-center/sessions'),
          fetch('/api/command-center/usage'),
          fetch('/api/command-center/conversations'),
        ])

        if (!agentsRes.ok || !sessionsRes.ok || !usageRes.ok || !conversationsRes.ok) {
          throw new Error('Failed to fetch command center data')
        }

        const agentsData = await agentsRes.json()
        const sessionsData = await sessionsRes.json()
        const usageData = await usageRes.json()
        const conversationsData = await conversationsRes.json()

        setAgents(agentsData.agents || [])
        setSessions(sessionsData.sessions || [])
        setUsage(usageData.usage || [])
        setActivity(usageData.activity || [])
        setConversations(conversationsData.conversations || [])
        setHeartbeat(usageData.heartbeat || { agents: [], defaultAgentId: '' })
      } catch (err) {
        console.error('Error fetching command center data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      case 'idle':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'offline':
        return 'text-gray-500 bg-gray-50 dark:bg-gray-800'
      default:
        return 'text-gray-500'
    }
  }

  const formatTimestamp = (ms: number) => {
    if (!ms) return 'Never'
    const date = new Date(ms)
    return date.toLocaleTimeString()
  }

  const formatDate = (ms: number) => {
    if (!ms) return 'Never'
    const date = new Date(ms)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const totalTokens = usage.reduce((sum, item) => sum + item.totalTokens, 0)
  const totalCost = usage.reduce((sum, item) => sum + item.totalCost, 0)

  // Shared store data for consistent metrics
  const [storeAgents, setStoreAgents] = useState<StoreAgent[]>([])
  const [metrics, setMetrics] = useState({ totalAgents: 0, activeAgents: 0, totalExecutions: 0, totalTokens: 0, totalCost: 0, successRate: 0 })
  useEffect(() => {
    setStoreAgents(getAgents())
    setMetrics(getMetrics())
  }, [loading])

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'agents' as TabType, label: 'Agents', icon: Zap },
    { id: 'conversations' as TabType, label: 'Conversations', icon: MessageCircle },
    { id: 'chats' as TabType, label: 'Chats', icon: MessageSquare },
    { id: 'usage' as TabType, label: 'Usage & Cost', icon: Gauge },
    { id: 'activity' as TabType, label: 'Activity', icon: Activity },
    { id: 'heartbeats' as TabType, label: 'Heartbeats', icon: AlertCircle },
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">OpenClaw Agent Management & Analytics</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-6">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Total Agents</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{metrics.totalAgents}</p>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">{metrics.activeAgents} active</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-6">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Executions</p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">{metrics.totalExecutions}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{metrics.successRate}% success</p>
              </div>
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl p-6">
                <p className="text-sm text-sky-600 dark:text-sky-400 font-medium mb-2">Tokens Used</p>
                <p className="text-3xl font-bold text-sky-900 dark:text-sky-300">{metrics.totalTokens.toLocaleString()}</p>
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl p-6">
                <p className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-2">Total Cost</p>
                <p className="text-3xl font-bold text-teal-900 dark:text-teal-300">${metrics.totalCost.toFixed(3)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent Status Summary */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Agent Status</h2>
                <div className="space-y-2">
                  {storeAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          agent.status === 'active' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Bot className={`w-4 h-4 ${agent.status === 'active' ? 'text-purple-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{agent.name}</span>
                          <p className="text-xs text-muted-foreground">{agent.llm} · {agent.role}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        agent.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Executions */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Recent Executions</h2>
                <div className="space-y-2">
                  {getExecutions().slice(0, 5).map((exec) => (
                    <div key={exec.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          exec.status === 'success' ? 'bg-emerald-500' :
                          exec.status === 'failed' ? 'bg-red-500' :
                          exec.status === 'running' ? 'bg-purple-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <span className="text-sm font-medium text-foreground">{exec.agentName}</span>
                          <p className="text-xs text-muted-foreground">{exec.trigger}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">${exec.cost.toFixed(3)}</span>
                        <p className="text-xs text-muted-foreground">{exec.startedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {currentTab === 'agents' && (
          <div className="p-6">
            {storeAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md">Create your first AI employee from the Agents page to start monitoring tools and automating workflows.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {storeAgents.map((agent) => (
                  <div key={agent.id} className="bg-card border border-border/80 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          agent.status === 'active' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Bot className={`w-5 h-5 ${agent.status === 'active' ? 'text-purple-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{agent.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            agent.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg font-medium">{agent.type}</span>
                      <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
                        <Cpu className="w-3 h-3" />{agent.llm}
                      </span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">{agent.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations Tab */}
        {currentTab === 'conversations' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Conversations</p>
                <p className="text-3xl font-bold text-foreground">{conversations.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Messages</p>
                <p className="text-3xl font-bold text-foreground">
                  {conversations.reduce((sum, conv) => sum + conv.count, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Platforms</p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(conversations.map((c) => c.platform)).size}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {conversations.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.context} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-between justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{conv.context}</h3>
                          <p className="text-xs text-muted-foreground">
                            {conv.count} messages • Last activity {formatDate(conv.lastTimestamp)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary">
                        {conv.platform}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 mb-2">{conv.preview}</p>
                    {conv.messages.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                        <div className="mb-1">
                          <span className="font-semibold">Latest:</span> {conv.messages[0]?.sender}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Conversations are automatically grouped by recipient and platform
            </p>
          </div>
        )}

        {/* Chats Tab */}
        {currentTab === 'chats' && (
          <div className="p-6">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {sessions.slice(0, 200).map((session, idx) => (
                  <div key={`${session.sessionId}-${idx}`} className="border-b border-border p-4">
                    <div className="flex items-between justify-between mb-2">
                      <div>
                        <p className="text-xs font-mono text-muted-foreground">{session.sessionId}</p>
                        <p className="text-xs text-muted-foreground">Agent: {session.agentId}</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {session.messages[0]?.role}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {session.messages[0]?.content || 'No content'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Showing 200 most recent messages</p>
          </div>
        )}

        {/* Usage & Cost Tab */}
        {currentTab === 'usage' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Cost</p>
                <p className="text-3xl font-bold text-foreground">${totalCost.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Tokens</p>
                <p className="text-3xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Model Count</p>
                <p className="text-3xl font-bold text-foreground">{usage.length}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Model</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Input Tokens</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Output Tokens</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Total Tokens</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Input Cost</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Output Cost</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usage.map((item) => (
                    <tr key={item.model} className="hover:bg-muted/50">
                      <td className="px-6 py-3 text-foreground font-medium text-xs">{item.model}</td>
                      <td className="px-6 py-3 text-right text-foreground">{item.inputTokens.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-foreground">{item.outputTokens.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-foreground font-semibold">
                        {item.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-foreground">${item.costInput.toFixed(4)}</td>
                      <td className="px-6 py-3 text-right text-foreground">${item.costOutput.toFixed(4)}</td>
                      <td className="px-6 py-3 text-right text-foreground font-semibold">
                        ${item.totalCost.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {currentTab === 'activity' && (
          <div className="p-6">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Timestamp</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Agent</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Session Key</th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground">Kind</th>
                      <th className="px-6 py-3 text-right font-semibold text-foreground">Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activity.map((log, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="px-6 py-3 text-muted-foreground text-xs">{formatDate(log.timestamp)}</td>
                        <td className="px-6 py-3 text-foreground font-medium">{log.agentId}</td>
                        <td className="px-6 py-3 text-muted-foreground text-xs font-mono">{log.key}</td>
                        <td className="px-6 py-3 text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded">{log.kind}</span>
                        </td>
                        <td className="px-6 py-3 text-right text-foreground">{log.tokensUsed.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Heartbeats Tab */}
        {currentTab === 'heartbeats' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Heartbeat Configuration</h2>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Default Agent: <span className="font-semibold text-foreground">{heartbeat.defaultAgentId}</span>
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Agent ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Enabled</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Schedule</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Interval (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {heartbeat.agents.map((agent) => (
                    <tr key={agent.agentId} className="hover:bg-muted/50">
                      <td className="px-6 py-3 text-foreground font-medium">{agent.agentId}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${agent.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                        ></span>
                        <span className="ml-2 text-sm text-foreground">{agent.enabled ? 'Yes' : 'No'}</span>
                      </td>
                      <td className="px-6 py-3 text-foreground">{agent.every}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {agent.everyMs ? agent.everyMs.toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
