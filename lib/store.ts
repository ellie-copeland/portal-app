'use client'

// Shared client-side data store — all pages read from here

export interface Agent {
  id: string
  name: string
  type: 'main' | 'sub'
  llm: string
  status: 'active' | 'inactive'
  description: string
  constraints: string[]
  role: string
}

export interface Execution {
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

const AGENTS_KEY = 'portal-agents'
const EXECUTIONS_KEY = 'portal-executions'

const DEFAULT_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Customer Support',
    type: 'main',
    llm: 'GPT-4',
    status: 'active',
    description: 'Primary agent for customer support — monitors Slack, email, and chat',
    constraints: ['No financial advice', 'Escalate complex issues'],
    role: 'Support Manager',
  },
  {
    id: '2',
    name: 'Sentry Monitor',
    type: 'sub',
    llm: 'Claude 3.5',
    status: 'active',
    description: 'Monitors Sentry errors, correlates with deploys, alerts on-call',
    constraints: ['Engineering channels only'],
    role: 'Error Monitor',
  },
  {
    id: '3',
    name: 'Sales Assistant',
    type: 'sub',
    llm: 'GPT-4',
    status: 'active',
    description: 'CRM automation — logs calls, updates deals, drafts follow-ups',
    constraints: ['Product knowledge only', 'No pricing overrides'],
    role: 'Sales Support',
  },
  {
    id: '4',
    name: 'Code Reviewer',
    type: 'sub',
    llm: 'Claude 3.5',
    status: 'active',
    description: 'Reviews PRs on GitHub, suggests improvements, checks for security issues',
    constraints: ['Read-only access', 'No auto-merge'],
    role: 'Code Quality',
  },
  {
    id: '5',
    name: 'Morning Briefing',
    type: 'sub',
    llm: 'GPT-4',
    status: 'active',
    description: 'Daily summary of all monitored channels — Slack, Sentry, GitHub, CRM',
    constraints: ['Scheduled only', '9 AM daily'],
    role: 'Daily Digest',
  },
]

const DEFAULT_EXECUTIONS: Execution[] = [
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
    agentName: 'Code Reviewer',
    trigger: 'GitHub PR #251 opened',
    status: 'warning',
    startedAt: '1 hour ago',
    duration: '6.2s',
    tokensUsed: 4200,
    cost: 0.011,
    model: 'Claude 3.5',
    input: 'Review PR: "Update onboarding flow for new team members"',
    output: 'Approved. Warning: 2 knowledge base articles referenced are outdated.',
  },
]

export function getAgents(): Agent[] {
  if (typeof window === 'undefined') return DEFAULT_AGENTS
  try {
    const raw = localStorage.getItem(AGENTS_KEY)
    if (!raw) {
      localStorage.setItem(AGENTS_KEY, JSON.stringify(DEFAULT_AGENTS))
      return DEFAULT_AGENTS
    }
    return JSON.parse(raw)
  } catch { return DEFAULT_AGENTS }
}

export function saveAgents(agents: Agent[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(AGENTS_KEY, JSON.stringify(agents)) } catch (e) { console.error("localStorage error:", e) }
}

export function getExecutions(): Execution[] {
  if (typeof window === 'undefined') return DEFAULT_EXECUTIONS
  try {
    const raw = localStorage.getItem(EXECUTIONS_KEY)
    if (!raw) {
      localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(DEFAULT_EXECUTIONS))
      return DEFAULT_EXECUTIONS
    }
    return JSON.parse(raw)
  } catch { return DEFAULT_EXECUTIONS }
}

// === Tasks ===
export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'stuck' | 'done'
  assignedAgent: string
  dueDate: string
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  scheduled: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high'
}

const TASKS_KEY = 'portal-tasks'

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Set up main agent', description: 'Configure the primary customer support agent', status: 'doing', assignedAgent: 'Main Customer Support', dueDate: '2026-02-15', recurring: 'none', scheduled: true, createdAt: '2026-02-11', priority: 'high' },
  { id: '2', title: 'Daily FAQ update', description: 'Update FAQ knowledge base', status: 'todo', assignedAgent: 'FAQ Bot', dueDate: '2026-02-12', recurring: 'daily', scheduled: true, createdAt: '2026-02-11', priority: 'medium' },
  { id: '3', title: 'Review performance metrics', description: 'Analyze agent performance last week', status: 'stuck', assignedAgent: 'Sales Assistant', dueDate: '2026-02-14', recurring: 'weekly', scheduled: false, createdAt: '2026-02-11', priority: 'medium' },
  { id: '4', title: 'Configure constraints', description: 'Set up safety constraints for all agents', status: 'done', assignedAgent: 'Main Customer Support', dueDate: '2026-02-10', recurring: 'none', scheduled: false, createdAt: '2026-02-09', priority: 'high' },
]

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return DEFAULT_TASKS
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (!raw) { localStorage.setItem(TASKS_KEY, JSON.stringify(DEFAULT_TASKS)); return DEFAULT_TASKS }
    return JSON.parse(raw)
  } catch { return DEFAULT_TASKS }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)) } catch (e) { console.error("localStorage error:", e) }
}

export function getMetrics() {
  const agents = getAgents()
  const executions = getExecutions()
  const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed, 0)
  const totalCost = executions.reduce((sum, e) => sum + e.cost, 0)
  const successRate = executions.length > 0
    ? Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100)
    : 0

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    totalExecutions: executions.length,
    totalTokens,
    totalCost,
    successRate,
  }
}
