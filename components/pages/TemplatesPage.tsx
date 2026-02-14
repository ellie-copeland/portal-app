'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Sparkles, Bot } from 'lucide-react'

interface Template {
  id: string
  name: string
  persona: string
  description: string
  model: string
  category: 'engineering' | 'sales' | 'devops' | 'productivity' | 'support' | 'marketing'
  avatar: string
  integrations: string[]
  constraints: string[]
  role: string
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 't-1',
    name: 'Linear Ticket Solver',
    persona: 'Alex — methodical, detail-oriented engineer who loves clean code',
    description: 'Automatically picks up assigned Linear issues, writes the code fix, and opens a pull request for your team to review.',
    model: 'Claude 3.5',
    category: 'engineering',
    avatar: '🔧',
    integrations: ['Linear', 'GitHub', 'Slack'],
    constraints: ['No force pushes', 'Max 500 LOC per PR', 'Requires review approval'],
    role: 'Ticket Resolution',
  },
  {
    id: 't-2',
    name: 'PR Review Bot',
    persona: 'Priya — sharp-eyed reviewer who catches bugs before they ship',
    description: 'Watches your open pull requests for review comments, addresses feedback automatically, and re-requests review until approved.',
    model: 'Claude 3.5',
    category: 'engineering',
    avatar: '👀',
    integrations: ['GitHub', 'Slack'],
    constraints: ['Read-only on main branch', 'No auto-merge'],
    role: 'Code Quality',
  },
  {
    id: 't-3',
    name: 'Incident Responder',
    persona: 'Marcus — calm under pressure, 10+ years SRE experience',
    description: 'Responds to Grafana alerts by investigating distributed traces, logs, and metrics to deliver a root-cause analysis.',
    model: 'GPT-4',
    category: 'devops',
    avatar: '🚨',
    integrations: ['Grafana', 'PagerDuty', 'Slack'],
    constraints: ['Alert team before any remediation', 'Document all findings'],
    role: 'Incident Management',
  },
  {
    id: 't-4',
    name: 'Sales Outreach Agent',
    persona: 'Jordan — warm, consultative seller who builds genuine rapport',
    description: 'Researches prospects, drafts personalized outreach emails, logs all activity to CRM, and schedules follow-ups automatically.',
    model: 'GPT-4',
    category: 'sales',
    avatar: '🤝',
    integrations: ['HubSpot', 'Gmail', 'LinkedIn'],
    constraints: ['No cold calling', 'Follow brand voice guide', 'Max 3 follow-ups per lead'],
    role: 'Lead Generation',
  },
  {
    id: 't-5',
    name: 'Customer Success Agent',
    persona: 'Sarah — empathetic, patient, loves helping people succeed',
    description: 'Monitors support channels, answers common questions instantly, escalates complex issues, and tracks satisfaction scores.',
    model: 'GPT-4',
    category: 'support',
    avatar: '💬',
    integrations: ['Slack', 'Intercom', 'HubSpot'],
    constraints: ['Never promise refunds', 'Escalate billing issues', 'Respond within 2 min'],
    role: 'Customer Support',
  },
  {
    id: 't-6',
    name: 'Log Monitor',
    persona: 'Dev — quiet observer who only speaks up when something is wrong',
    description: 'Continuously monitors your backend application logs for errors, exceptions, and anomalous patterns before they become incidents.',
    model: 'Claude 3.5',
    category: 'devops',
    avatar: '📊',
    integrations: ['Grafana', 'Slack'],
    constraints: ['Alert only on P1/P2', 'No direct infrastructure changes'],
    role: 'Observability',
  },
  {
    id: 't-7',
    name: 'Content Writer',
    persona: 'Maya — creative storyteller with a knack for SEO',
    description: 'Drafts blog posts, social media content, and email campaigns based on company updates and trending topics in your industry.',
    model: 'GPT-4',
    category: 'marketing',
    avatar: '✍️',
    integrations: ['Notion', 'Slack', 'WordPress'],
    constraints: ['Follow brand guidelines', 'Include sources', 'No AI disclosure bypass'],
    role: 'Content Creation',
  },
  {
    id: 't-8',
    name: 'Morning Briefing Agent',
    persona: 'Kai — concise, organized, gets straight to what matters',
    description: 'Generates a daily summary of all monitored channels — Slack threads, Sentry errors, GitHub activity, CRM updates, and calendar events.',
    model: 'GPT-4',
    category: 'productivity',
    avatar: '☀️',
    integrations: ['Slack', 'Sentry', 'GitHub', 'HubSpot', 'Google Calendar'],
    constraints: ['Run at 9 AM daily', 'Max 500 words', 'Highlight action items'],
    role: 'Daily Digest',
  },
  {
    id: 't-9',
    name: 'Team Slack Engineer',
    persona: 'Riley — friendly tech lead your whole team can chat with',
    description: 'A shared AI engineer your team can talk to in Slack. Investigates code, queries logs and metrics, and answers technical questions with real context.',
    model: 'Claude 3.5',
    category: 'engineering',
    avatar: '💻',
    integrations: ['Slack', 'GitHub', 'Grafana'],
    constraints: ['No production access', 'Read-only permissions', 'Tag humans for deploys'],
    role: 'Team Assistant',
  },
  {
    id: 't-10',
    name: 'Deal Closer',
    persona: 'Chris — strategic closer who knows when to push and when to listen',
    description: 'Tracks deal progression, auto-logs call notes to CRM, prepares context briefs before meetings, and nudges stalled deals.',
    model: 'GPT-4',
    category: 'sales',
    avatar: '🎯',
    integrations: ['HubSpot', 'Gmail', 'Slack', 'Zoom'],
    constraints: ['No discount authority', 'Escalate deals over $50k', 'Follow sales playbook'],
    role: 'Deal Management',
  },
  {
    id: 't-11',
    name: 'On-Call Companion',
    persona: 'Sam — reliable night-owl who has your back at 3 AM',
    description: 'Your on-call assistant when you are away from your laptop. Diagnose production issues, inspect pod logs, and manage incidents through chat.',
    model: 'Claude 3.5',
    category: 'devops',
    avatar: '🌙',
    integrations: ['PagerDuty', 'Slack', 'Grafana', 'Kubernetes'],
    constraints: ['No restarts without approval', 'Document all actions', 'Escalate after 15 min'],
    role: 'On-Call Support',
  },
  {
    id: 't-12',
    name: 'Meeting Notes Agent',
    persona: 'Dana — organized, never misses a detail, perfect memory',
    description: 'Joins meetings, takes structured notes, extracts action items, and posts summaries to Slack and Notion automatically.',
    model: 'GPT-4',
    category: 'productivity',
    avatar: '📝',
    integrations: ['Zoom', 'Slack', 'Notion', 'Google Calendar'],
    constraints: ['No recording without consent', 'Summarize within 5 min', 'Tag action item owners'],
    role: 'Meeting Management',
  },
]

const categories = [
  { id: 'all', label: 'All' },
  { id: 'engineering', label: 'Engineering Workflow' },
  { id: 'sales', label: 'Sales & Outreach' },
  { id: 'devops', label: 'DevOps & Infrastructure' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'support', label: 'Customer Support' },
  { id: 'marketing', label: 'Marketing' },
]

const integrationColors: Record<string, string> = {
  'Slack': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  'GitHub': 'bg-gray-100 text-gray-700',
  'Linear': 'bg-violet-100 text-violet-700',
  'Grafana': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  'PagerDuty': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  'HubSpot': 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  'Gmail': 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  'LinkedIn': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'Intercom': 'bg-sky-100 text-sky-700',
  'Notion': 'bg-gray-100 text-gray-700',
  'WordPress': 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'Sentry': 'bg-violet-50 text-violet-600',
  'Google Calendar': 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'Zoom': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'Kubernetes': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deployed, setDeployed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
      const res = await fetch('/api/templates', { headers })
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setTemplates(data.templates || DEFAULT_TEMPLATES)
    } catch (err) {
      console.error('Error fetching templates:', err)
      // Fall back to default templates
      setTemplates(DEFAULT_TEMPLATES)
    } finally {
      setLoading(false)
    }
  }

  const filtered = templates.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.persona.toLowerCase().includes(q)
    }
    return true
  })

  const handleDeploy = async (template: Template) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const res = await fetch('/api/agents/v2/from-template', {
        method: 'POST',
        headers,
        body: JSON.stringify({ templateId: template.id }),
      })

      if (!res.ok) throw new Error('Failed to deploy template')
      setDeployed(prev => new Set(prev).add(template.id))
    } catch (err) {
      console.error('Error deploying template:', err)
      setError(err instanceof Error ? err.message : 'Failed to deploy template')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Templates</h1>
            <p className="text-muted-foreground">Pre-configured AI employees for common workflows. Pick one to get started quickly.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-sm whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Start from Scratch
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 sm:mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Templates Grid */}
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        ) : (
          <>
            {activeCategory !== 'all' && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {categories.find(c => c.id === activeCategory)?.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} template{filtered.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(template => (
            <div
              key={template.id}
              className="bg-card border border-border/80 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {template.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                  {/* Persona */}
                  <div className="bg-muted/50 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Persona:</span> {template.persona}
                    </p>
                  </div>

                  {/* Model + Integrations */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-lg font-medium border border-teal-100 dark:border-teal-800">
                      {template.model}
                    </span>
                    {template.integrations.map(int => (
                      <span
                        key={int}
                        className={`text-xs px-2 py-1 rounded-lg font-medium ${integrationColors[int] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {int}
                      </span>
                    ))}
                  </div>

                  {/* Deploy button */}
                  {deployed.has(template.id) ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      <Sparkles className="w-4 h-4" />
                      Deployed to Agents
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeploy(template)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                    >
                      <Bot className="w-4 h-4" />
                      Deploy Agent
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
