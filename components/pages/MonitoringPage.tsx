'use client'

import { useState } from 'react'
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Eye, GitBranch, Link, MessageSquare, Search, Shield, Zap } from 'lucide-react'

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

const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    severity: 'critical',
    title: 'NullPointerException spike in PaymentProcessor',
    description: 'Error rate jumped 340% in the last 15 minutes. 23 users affected.',
    source: 'Sentry',
    correlatedWith: ['Deploy #892 (15 min ago)', 'Slack: 3 customer complaints in #support'],
    timestamp: '2 min ago',
    status: 'new',
    agent: 'Sentry Monitor',
    suggestedAction: 'Roll back deploy #892 and notify on-call engineer',
  },
  {
    id: 'a2',
    severity: 'warning',
    title: 'Deal "Acme Corp Enterprise" stale for 8 days',
    description: 'No activity on $45k deal since last meeting. Follow-up overdue.',
    source: 'HubSpot',
    correlatedWith: ['Gmail: Last email from john@acme.com 8 days ago', 'Calendar: No meetings scheduled'],
    timestamp: '1 hour ago',
    status: 'acknowledged',
    agent: 'Sales Assistant',
    suggestedAction: 'Draft follow-up email referencing their Q2 budget timeline',
  },
  {
    id: 'a3',
    severity: 'info',
    title: 'PR #251 approved — ready to merge',
    description: 'Code review complete with 2 minor suggestions addressed.',
    source: 'GitHub',
    correlatedWith: ['Linear: Ticket #1247 will be auto-closed on merge'],
    timestamp: '15 min ago',
    status: 'resolved',
    agent: 'Code Reviewer',
    suggestedAction: 'Merge PR and close Linear ticket',
  },
  {
    id: 'a4',
    severity: 'warning',
    title: 'Customer sentiment drop detected',
    description: '3 negative messages in #support in the last hour. Avg response time: 12 min (target: 5 min).',
    source: 'Slack',
    correlatedWith: ['Sentry: Related to payment processing errors', 'HubSpot: 2 affected are Enterprise tier'],
    timestamp: '25 min ago',
    status: 'new',
    agent: 'Customer Support',
    suggestedAction: 'Prioritize Enterprise customer responses and link to known Sentry issue',
  },
  {
    id: 'a5',
    severity: 'critical',
    title: 'API rate limit approaching on HubSpot',
    description: '87% of daily API quota consumed. Will hit limit in ~2 hours at current rate.',
    source: 'HubSpot',
    correlatedWith: ['Executions: Sales Assistant made 142 API calls today'],
    timestamp: '5 min ago',
    status: 'acknowledged',
    agent: 'Sales Assistant',
    suggestedAction: 'Throttle CRM sync frequency from 1 min to 5 min intervals',
  },
]

const MOCK_WATCH_RULES: WatchRule[] = [
  { id: 'w1', name: 'Sentry error spike', source: 'Sentry', condition: 'Error rate > 200% baseline', escalation: 'notify', enabled: true },
  { id: 'w2', name: 'Stale CRM deals', source: 'HubSpot', condition: 'No activity > 7 days on deals > $10k', escalation: 'supervised', enabled: true },
  { id: 'w3', name: 'Failed deploys', source: 'GitHub', condition: 'CI/CD pipeline failure on main branch', escalation: 'notify', enabled: true },
  { id: 'w4', name: 'Customer complaints', source: 'Slack', condition: 'Negative sentiment in #support > 3 per hour', escalation: 'auto', enabled: true },
  { id: 'w5', name: 'API quota warning', source: 'Any', condition: 'API usage > 80% of daily limit', escalation: 'notify', enabled: false },
]

const severityConfig = {
  critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Bell },
  info: { color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', icon: CheckCircle2 },
}

export default function MonitoringPage() {
  const [alerts] = useState(MOCK_ALERTS)
  const [rules] = useState(MOCK_WATCH_RULES)
  const [activeTab, setActiveTab] = useState<'feed' | 'rules'>('feed')
  const [filterSeverity, setFilterSeverity] = useState('all')

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
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{alerts.filter(a => a.severity === 'critical').length}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-amber-600 font-medium">Warnings</p>
            <p className="text-2xl font-bold text-amber-700">{alerts.filter(a => a.severity === 'warning').length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 font-medium">Resolved</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{alerts.filter(a => a.status === 'resolved').length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 font-medium">Active Rules</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{rules.filter(r => r.enabled).length}</p>
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
        {activeTab === 'feed' && (
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
              {filtered.map(alert => {
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
              })}
            </div>
          </>
        )}

        {activeTab === 'rules' && (
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
