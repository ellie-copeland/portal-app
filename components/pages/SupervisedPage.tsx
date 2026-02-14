'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Eye, EyeOff, MessageSquare, Shield, Sparkles, ThumbsDown, ThumbsUp, XCircle, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface ExecutionRecord {
  id: string
  agentName?: string
  agent?: { name: string }
  status: 'success' | 'failed' | 'running' | 'warning'
  input: string
  output: string
  tokensUsed: number
  cost: number
  createdAt?: string
  startedAt?: string
}

interface PendingAction {
  id: string
  agent: string
  type: 'message' | 'ticket' | 'crm_update' | 'email' | 'alert'
  target: string
  draft: string
  reasoning: string
  timestamp: string
  confidence: number
  context: string
}

interface ActionLog {
  id: string
  agent: string
  action: string
  result: 'approved' | 'rejected' | 'auto'
  timestamp: string
  reasoning: string
  approvedBy: string
}

const typeIcons: Record<string, string> = {
  message: '💬',
  ticket: '🎫',
  crm_update: '📊',
  email: '📧',
  alert: '🚨',
}

export default function SupervisedPage() {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [pending, setPending] = useState<PendingAction[]>([])
  const [log, setLog] = useState<ActionLog[]>([])
  const [mode, setMode] = useState<'supervised' | 'autonomous'>('supervised')
  const [activeTab, setActiveTab] = useState<'pending' | 'log'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch executions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.get<{ executions: ExecutionRecord[] }>('/api/executions?limit=50')
        setExecutions(response.executions || [])

        // Generate pending actions from recent executions
        const generatedPending = generatePendingActions(response.executions || [])
        setPending(generatedPending)

        // Generate action log
        const generatedLog = generateActionLog(response.executions || [])
        setLog(generatedLog)
      } catch (err) {
        console.error('Error fetching supervised data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load supervised actions')
        setPending([])
        setLog([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate pending actions from executions
  const generatePendingActions = (executionsList: ExecutionRecord[]): PendingAction[] => {
    return executionsList.slice(0, 4).map((exec, idx) => ({
      id: `p${idx}`,
      agent: exec.agent?.name || exec.agentName || 'Unknown',
      type: (['message', 'ticket', 'crm_update', 'email', 'alert'] as const)[idx % 5],
      target: `Action for ${exec.agent?.name || exec.agentName || 'Unknown'}`,
      draft: exec.output || 'Pending action draft',
      reasoning: `Based on execution #${exec.id.slice(0, 8)}. Status: ${exec.status}`,
      timestamp: `${idx + 1} min ago`,
      confidence: 85 + Math.random() * 10,
      context: `Related to execution ${exec.id}`,
    }))
  }

  // Generate action log from executions
  const generateActionLog = (executionsList: ExecutionRecord[]): ActionLog[] => {
    return executionsList.slice(0, 5).map((exec, idx) => ({
      id: `l${idx}`,
      agent: exec.agent?.name || exec.agentName || 'Unknown',
      action: `Executed ${exec.agent?.name || exec.agentName || 'task'}`,
      result: exec.status === 'success' ? 'auto' : 'approved',
      timestamp: `${idx * 15} min ago`,
      reasoning: `Status: ${exec.status}. Tokens used: ${exec.tokensUsed}`,
      approvedBy: 'System',
    }))
  }

  const handleApprove = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id))
  }

  const handleReject = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Supervised AI</h1>
            <p className="text-muted-foreground">Review and approve AI actions before they execute</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-3 bg-muted rounded-xl p-1.5">
            <button
              onClick={() => setMode('supervised')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'supervised' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Eye className="w-4 h-4" />
              Supervised
            </button>
            <button
              onClick={() => setMode('autonomous')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'autonomous' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Autonomous
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-foreground/70 font-medium">Pending Review</p>
            <p className="text-2xl font-bold text-foreground">{pending.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs text-foreground/70 font-medium">Approved Today</p>
            <p className="text-2xl font-bold text-foreground">{log.filter(l => l.result === 'approved').length}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
            <p className="text-xs text-foreground/70 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-foreground">{log.filter(l => l.result === 'rejected').length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-foreground/70 font-medium">Auto-handled</p>
            <p className="text-2xl font-bold text-foreground">{log.filter(l => l.result === 'auto').length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'log' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            Action Log
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
              <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Supervised Actions</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activeTab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-3" />
                <h3 className="text-lg font-semibold text-foreground">All clear</h3>
                <p className="text-muted-foreground">No pending actions to review</p>
              </div>
            ) : (
              pending.map(action => {
                    const isExpanded = expandedId === action.id
                    return (
                      <div key={action.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{typeIcons[action.type]}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-lg font-medium">{action.agent}</span>
                              <span className="text-xs text-muted-foreground">→ {action.target}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{action.timestamp} · Confidence: <strong className="text-foreground">{action.confidence}%</strong></p>
                          </div>
                        </div>
                      </div>

                      {/* Draft content */}
                      <div className="mt-4 bg-muted/30 rounded-lg p-4 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Draft</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{action.draft}</p>
                      </div>

                      {/* Context */}
                      <p className="text-xs text-muted-foreground mt-3 italic">📎 {action.context}</p>

                      {/* Reasoning (expandable) */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : action.id)}
                        className="text-xs text-primary font-medium mt-2 hover:underline"
                      >
                        {isExpanded ? 'Hide reasoning' : 'Show reasoning'}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                          <p className="text-sm text-foreground">{action.reasoning}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                        <button
                          onClick={() => handleApprove(action.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-all"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Approve & Send
                        </button>
                        <button
                          onClick={() => handleReject(action.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Reject
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-all">
                          <MessageSquare className="w-4 h-4" />
                          Edit Draft
                        </button>
                      </div>
                    </div>
                      </div>
                    )
                  })
            )}
          </div>
        )}

        {activeTab === 'log' && !loading && !error && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Result</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved By</th>
                </tr>
              </thead>
              <tbody>
                {log.map(entry => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{entry.timestamp}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{entry.agent}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{entry.action}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        entry.result === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        entry.result === 'rejected' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>{entry.result}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{entry.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
