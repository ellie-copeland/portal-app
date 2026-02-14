'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, CheckCircle2, XCircle, AlertTriangle, Search, Filter, ChevronDown } from 'lucide-react'

interface Execution {
  id: string
  agentName: string
  trigger: string
  status: 'success' | 'failed' | 'running' | 'warning'
  startedAt: string
  duration: string
  tokensUsed: number
  cost: number
  model: string
  input: string
  output: string
}

const PLACEHOLDER_EXECUTIONS: Execution[] = [
  {
    id: 'exec-001',
    agentName: 'Customer Support',
    trigger: 'Slack mention in #support',
    status: 'success',
    startedAt: '2 min ago',
    duration: '3.2s',
    tokensUsed: 1847,
    cost: 0.004,
    model: 'GPT-4',
    input: 'User asked about billing issue with subscription',
    output: 'Provided step-by-step guide to resolve billing discrepancy',
  },
  {
    id: 'exec-002',
    agentName: 'Sentry Monitor',
    trigger: 'Sentry webhook — NullPointerException',
    status: 'success',
    startedAt: '8 min ago',
    duration: '5.1s',
    tokensUsed: 3204,
    cost: 0.008,
    model: 'Claude 3.5',
    input: 'Sentry error #4821: NullPointerException in PaymentProcessor.java:142',
    output: 'Correlated with deploy #892. Notified on-call engineer. Created Linear ticket.',
  },
  {
    id: 'exec-003',
    agentName: 'Sales Assistant',
    trigger: 'CRM deal stage change',
    status: 'running',
    startedAt: 'Just now',
    duration: '1.4s',
    tokensUsed: 892,
    cost: 0.002,
    model: 'GPT-4',
    input: 'Deal "Acme Corp Enterprise" moved to Proposal stage',
    output: 'Generating follow-up email draft...',
  },
  {
    id: 'exec-004',
    agentName: 'Code Reviewer',
    trigger: 'GitHub PR #247 opened',
    status: 'success',
    startedAt: '15 min ago',
    duration: '12.3s',
    tokensUsed: 8432,
    cost: 0.021,
    model: 'Claude 3.5',
    input: 'Review PR: "Add rate limiting to auth endpoints"',
    output: 'Approved with 2 suggestions: move rate limit config to env, add test for edge case',
  },
  {
    id: 'exec-005',
    agentName: 'Customer Support',
    trigger: 'Email from john@acme.com',
    status: 'failed',
    startedAt: '22 min ago',
    duration: '0.8s',
    tokensUsed: 0,
    cost: 0,
    model: 'GPT-4',
    input: 'Inbound email about contract renewal',
    output: 'Error: CRM API rate limit exceeded. Retry scheduled.',
  },
  {
    id: 'exec-006',
    agentName: 'Morning Briefing',
    trigger: 'Scheduled — 9:00 AM daily',
    status: 'success',
    startedAt: '3 hours ago',
    duration: '18.7s',
    tokensUsed: 12450,
    cost: 0.031,
    model: 'GPT-4',
    input: 'Generate daily briefing across all monitored channels',
    output: '12 Slack threads summarized, 3 Sentry alerts, 5 PRs merged, 2 deals updated',
  },
  {
    id: 'exec-007',
    agentName: 'Onboarding Agent',
    trigger: 'New team member joined #general',
    status: 'warning',
    startedAt: '1 hour ago',
    duration: '6.2s',
    tokensUsed: 4200,
    cost: 0.011,
    model: 'Claude 3.5',
    input: 'New member Sarah joined. Prepare onboarding context.',
    output: 'Onboarding docs sent. Warning: 2 knowledge base articles outdated.',
  },
]

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Success' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Failed' },
  running: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Running' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Warning' },
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchExecutions()
  }, [])

  const fetchExecutions = async () => {
    try {
      setLoading(true)
      setError(null)
      const { authHeaders: getAuth } = await import('@/lib/fetch-auth')
      const headers = getAuth()
      const res = await fetch('/api/executions', { headers })
      if (!res.ok) throw new Error('Failed to fetch executions')
      const data = await res.json()
      setExecutions(data.executions || [])
    } catch (err) {
      console.error('Error fetching executions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load executions')
    } finally {
      setLoading(false)
    }
  }

  const filtered = executions.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    if (searchQuery && !e.agentName.toLowerCase().includes(searchQuery.toLowerCase()) && !e.trigger.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed, 0)
  const totalCost = executions.reduce((sum, e) => sum + e.cost, 0)
  const successRate = Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Executions</h1>
            <p className="text-muted-foreground">Monitor agent runs, logs, and performance</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-sm text-foreground/70 font-medium">Total Runs</p>
            <p className="text-2xl font-bold text-foreground">{executions.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-sm text-foreground/70 font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-foreground">{successRate}%</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-100 dark:border-sky-800">
            <p className="text-sm text-foreground/70 font-medium">Tokens Used</p>
            <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <p className="text-sm text-foreground/70 font-medium">Total Cost</p>
            <p className="text-2xl font-bold text-foreground">${totalCost.toFixed(3)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-border bg-card/50 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by agent or trigger..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {['all', 'success', 'failed', 'running', 'warning'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Execution List */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading executions...</p>
          </div>
        ) : executions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No executions yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">Executions will appear here once your agents start running.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {filtered.map(exec => {
            const config = statusConfig[exec.status]
            const StatusIcon = config.icon
            const isExpanded = expandedId === exec.id

            return (
              <div
                key={exec.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 text-left"
                >
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{exec.agentName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{exec.trigger}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exec.duration}
                    </span>
                    <span>{exec.tokensUsed.toLocaleString()} tokens</span>
                    <span className="text-foreground font-medium">${exec.cost.toFixed(3)}</span>
                    <span className="text-xs">{exec.startedAt}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-5 pt-0 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Input</p>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">{exec.input}</div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Output</p>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">{exec.output}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Model: <strong className="text-foreground">{exec.model}</strong></span>
                      <span>ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{exec.id}</code></span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        )}
      </div>
    </div>
  )
}
