'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Eye, GitBranch, Link, MessageSquare, Search, Shield, Zap, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Agent {
  id: string
  name: string
  status: 'active' | 'inactive'
  _count?: { executions: number }
}

interface ExecutionRecord {
  id: string
  agentName?: string
  agent?: { name: string }
  status: 'success' | 'failed' | 'running' | 'warning'
  createdAt?: string
  startedAt?: string
}

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  source: string
  correlatedWith: string[]
  timestamp: string
  status: 'new' | 'acknowledged' | 'resolved'
  agent: string
  suggestedAction: string
}

interface WatchRule {
  id: string
  name: string
  source: string
  condition: string
  escalation: 'auto' | 'notify' | 'supervised'
  enabled: boolean
}

const severityConfig = {
  critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Bell },
  info: { color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', icon: CheckCircle2 },
}

export default function MonitoringPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules] = useState<WatchRule[]>([
    { id: 'w1', name: 'Sentry error spike', source: 'Sentry', condition: 'Error rate > 200% baseline', escalation: 'notify', enabled: true },
    { id: 'w2', name: 'Failed agent executions', source: 'Executions', condition: 'Failure rate > 10%', escalation: 'supervised', enabled: true },
    { id: 'w3', name: 'High latency detection', source: 'Performance', condition: 'Execution duration > 30s', escalation: 'notify', enabled: true },
    { id: 'w4', name: 'Agent status change', source: 'Agents', condition: 'Agent status change', escalation: 'auto', enabled: true },
    { id: 'w5', name: 'Execution volume spike', source: 'Metrics', condition: 'Executions > 2x baseline', escalation: 'notify', enabled: false },
  ])
  const [activeTab, setActiveTab] = useState<'feed' | 'rules'>('feed')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch agents and executions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [agentsRes, executionsRes] = await Promise.all([
          apiClient.get<{ agents: Agent[] }>('/api/agents'),
          apiClient.get<{ executions: ExecutionRecord[] }>('/api/executions?limit=50'),
        ])

        setAgents(agentsRes.agents || [])
        setExecutions(executionsRes.executions || [])

        // Generate alerts based on execution data
        const generatedAlerts = generateAlerts(agentsRes.agents || [], executionsRes.executions || [])
        setAlerts(generatedAlerts)
      } catch (err) {
        console.error('Error fetching monitoring data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load monitoring data')
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate alerts from execution data
  const generateAlerts = (agentsList: Agent[], executionsList: ExecutionRecord[]): Alert[] => {
    const generatedAlerts: Alert[] = []

    if (executionsList.length === 0) return generatedAlerts

    // Check for failed executions (severity: critical)
    const failedCount = executionsList.filter(e => e.status === 'failed').length
    if (failedCount > 0) {
      generatedAlerts.push({
        id: 'a-failed',
        severity: 'critical',
        title: `${failedCount} Failed Executions`,
        description: `${failedCount} executions failed in the last period.`,
        source: 'Executions',
        correlatedWith: ['Check execution logs for details'],
        timestamp: 'Just now',
        status: 'new',
        agent: 'System',
        suggestedAction: 'Review failed execution logs and retry',
      })
    }

    // Check for agent status
    agentsList.forEach(agent => {
      if (agent.status === 'inactive') {
        generatedAlerts.push({
          id: `a-${agent.id}`,
          severity: 'warning',
          title: `Agent "${agent.name}" is inactive`,
          description: `The agent is currently disabled.`,
          source: 'Agent Status',
          correlatedWith: [`Executions: ${agent._count?.executions || 0} total`],
          timestamp: '30 min ago',
          status: 'acknowledged',
          agent: agent.name,
          suggestedAction: 'Enable agent or investigate why it was disabled',
        })
      }
    })

    // Add a sample info alert
    if (executionsList.length > 0) {
      generatedAlerts.push({
        id: 'a-success',
        severity: 'info',
        title: `${executionsList.filter(e => e.status === 'success').length} Successful Executions`,
        description: 'Executions completed successfully in the last period.',
        source: 'Executions',
        correlatedWith: ['All systems operational'],
        timestamp: '5 min ago',
        status: 'resolved',
        agent: 'System',
        suggestedAction: 'Continue normal operations',
      })
    }

    return generatedAlerts.slice(0, 5) // Limit to 5 alerts
  }

  const filtered = filterSeverity === 'all' ? alerts : alerts.filter(a => a.severity === filterSeverity)
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'new').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Monitoring</h1>
              {criticalCount > 0 && (
                <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {criticalCount} critical
                </span>
              )}
            </div>
            <p className="text-muted-foreground">Cross-tool alerts, context correlation, and watch rules</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
            <p className="text-xs text-red-600 font-medium">Critical</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{alerts.filter(a => a.severity === 'critical').length}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-amber-600 font-medium">Warnings</p>
            <p className="text-2xl font-bold text-amber-700">{alerts.filter(a => a.severity === 'warning').length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 font-medium">Resolved</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{alerts.filter(a => a.status === 'resolved').length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 font-medium">Active Rules</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{rules.filter(r => r.enabled).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'feed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Alert Feed
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rules' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Watch Rules
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Monitoring Data</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activeTab === 'feed' && (
          <>
            {/* Severity filter */}
            <div className="flex gap-2 mb-5">
              {['all', 'critical', 'warning', 'info'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterSeverity === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Alert cards */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-center">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No alerts</h3>
                    <p className="text-muted-foreground">Everything looks good</p>
                  </div>
                </div>
              ) : (
                filtered.map(alert => {
                  const config = severityConfig[alert.severity]
                  const SeverityIcon = config.icon
                  return (
                    <div key={alert.id} className={`bg-card border ${config.border} rounded-xl p-5 hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <SeverityIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              alert.status === 'new' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                              alert.status === 'acknowledged' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                              'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            }`}>{alert.status}</span>
                            <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                          </div>
                        </div>

                        {/* Context Correlation */}
                        <div className="mt-3 bg-muted/40 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Link className="w-3 h-3" /> Connected Context
                          </p>
                          <div className="space-y-1">
                            {alert.correlatedWith.map((ctx, i) => (
                              <p key={i} className="text-sm text-foreground flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                {ctx}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Suggested Action */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg font-medium">{alert.agent}</span>
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">{alert.source}</span>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                              Approve Action
                            </button>
                            <button className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg font-medium hover:text-foreground">
                              Dismiss
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-teal-600 mt-2 italic">💡 Suggested: {alert.suggestedAction}</p>
                      </div>
                    </div>
                  </div>
                    )
                  })
              )}
            </div>
          </>
        )}

        {activeTab === 'rules' && !loading && !error && (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <div>
                    <h3 className="font-semibold text-foreground">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground">{rule.condition}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{rule.source}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        rule.escalation === 'auto' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        rule.escalation === 'notify' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                        'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {rule.escalation === 'auto' ? 'Auto-handle' : rule.escalation === 'notify' ? 'Notify team' : 'Supervised'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  rule.enabled ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {rule.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
