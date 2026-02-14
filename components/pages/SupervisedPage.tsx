'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Eye, EyeOff, MessageSquare, Shield, Sparkles, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react'

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

const MOCK_PENDING: PendingAction[] = [
  {
    id: 'p1',
    agent: 'Customer Support',
    type: 'message',
    target: 'Slack #support → @sarah.chen',
    draft: "Hi Sarah, I see you're experiencing issues with your subscription billing. I've looked into it and found the charge was duplicated due to a payment processing error we identified earlier today. I've initiated a refund for the duplicate charge — you should see it within 3-5 business days. Let me know if you need anything else!",
    reasoning: 'Customer reported billing issue. Cross-referenced with Sentry alert showing PaymentProcessor error. Refund policy allows auto-refund for duplicate charges under $100.',
    timestamp: '30s ago',
    confidence: 94,
    context: 'Related to Sentry error #4821. Customer is Enterprise tier.',
  },
  {
    id: 'p2',
    agent: 'Sales Assistant',
    type: 'email',
    target: 'Gmail → john@acme.com',
    draft: "Hi John, hope your Q2 planning is going well! I wanted to follow up on our conversation about the Enterprise plan. I noticed your team has been using our API heavily this month (142 calls yesterday alone), which suggests great adoption. Would it make sense to hop on a quick call this week to discuss scaling your plan before the Q2 budget deadline? I have Thursday 2-4 PM open.",
    reasoning: 'Deal stale for 8 days. HubSpot shows high API usage indicating product adoption. Q2 budget cycle approaching. Personalized follow-up likely to re-engage.',
    timestamp: '2 min ago',
    confidence: 87,
    context: 'Acme Corp Enterprise deal — $45k. Last contact 8 days ago.',
  },
  {
    id: 'p3',
    agent: 'Sentry Monitor',
    type: 'ticket',
    target: 'Linear → Engineering team',
    draft: '[P1] PaymentProcessor NullPointerException — Root cause: null check missing on payment_method field after deploy #892. Affects checkout flow. 23 users impacted in last 15 min. Suggested fix: Add null guard at PaymentProcessor.java:142.',
    reasoning: 'Error rate 340% above baseline. Correlates with deploy #892 (15 min ago). Pattern matches missing null check. 23 unique users affected — meets P1 threshold.',
    timestamp: '5 min ago',
    confidence: 91,
    context: 'Deploy #892 by @marcus. Rollback available.',
  },
  {
    id: 'p4',
    agent: 'Code Reviewer',
    type: 'message',
    target: 'GitHub PR #251 → @dev-team',
    draft: 'Looks good overall! Two suggestions:\n1. The onboarding docs reference a deprecated API endpoint (v1/users). Should be v2/users.\n2. Consider adding a loading state for the team directory fetch — it hangs for ~2s on slow connections.\n\nApproved with minor changes requested.',
    reasoning: 'PR passes all CI checks. Code quality meets standards. Found 2 non-blocking issues through static analysis and documentation cross-reference.',
    timestamp: '8 min ago',
    confidence: 96,
    context: 'PR: "Update onboarding flow for new team members"',
  },
]

const MOCK_LOG: ActionLog[] = [
  { id: 'l1', agent: 'Morning Briefing', action: 'Posted daily summary to #general', result: 'auto', timestamp: '9:00 AM', reasoning: 'Scheduled task — autonomous mode', approvedBy: 'System' },
  { id: 'l2', agent: 'Code Reviewer', action: 'Approved PR #249 with comments', result: 'approved', timestamp: '11:23 AM', reasoning: 'All CI passed, code quality good', approvedBy: 'Brady M.' },
  { id: 'l3', agent: 'Sales Assistant', action: 'Updated deal stage: Acme Corp → Proposal', result: 'approved', timestamp: '10:45 AM', reasoning: 'Meeting completed, next step agreed', approvedBy: 'Jordan W.' },
  { id: 'l4', agent: 'Customer Support', action: 'Draft response to billing complaint', result: 'rejected', timestamp: '10:12 AM', reasoning: 'Refund amount exceeded auto-approval threshold', approvedBy: 'Sarah C.' },
  { id: 'l5', agent: 'Sentry Monitor', action: 'Created P2 ticket for memory leak', result: 'auto', timestamp: '8:30 AM', reasoning: 'P2 tickets auto-created per watch rules', approvedBy: 'System' },
]

const typeIcons: Record<string, string> = {
  message: '💬',
  ticket: '🎫',
  crm_update: '📊',
  email: '📧',
  alert: '🚨',
}

export default function SupervisedPage() {
  const [pending, setPending] = useState(MOCK_PENDING)
  const [log] = useState(MOCK_LOG)
  const [mode, setMode] = useState<'supervised' | 'autonomous'>('supervised')
  const [activeTab, setActiveTab] = useState<'pending' | 'log'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
            <p className="text-xs text-amber-600 font-medium">Pending Review</p>
            <p className="text-2xl font-bold text-amber-700">{pending.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 font-medium">Approved Today</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{log.filter(l => l.result === 'approved').length}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
            <p className="text-xs text-red-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{log.filter(l => l.result === 'rejected').length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 font-medium">Auto-handled</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{log.filter(l => l.result === 'auto').length}</p>
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
        {activeTab === 'pending' && (
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
                        <div className="mt-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100">
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

        {activeTab === 'log' && (
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
