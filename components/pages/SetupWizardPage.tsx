'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Link2, Settings, Sparkles, Users, Zap } from 'lucide-react'
import { getAgents, saveAgents, Agent } from '@/lib/store'

const TOOLS = [
  { id: 'slack', name: 'Slack', icon: '💬', desc: 'Monitor channels and respond to mentions' },
  { id: 'github', name: 'GitHub', icon: '🐙', desc: 'Review PRs, track issues, monitor deploys' },
  { id: 'sentry', name: 'Sentry', icon: '🛡️', desc: 'Monitor errors and alert on spikes' },
  { id: 'hubspot', name: 'HubSpot', icon: '🔶', desc: 'Auto-log calls, update deals, track contacts' },
  { id: 'gmail', name: 'Gmail', icon: '📧', desc: 'Monitor inboxes and draft responses' },
  { id: 'linear', name: 'Linear', icon: '📋', desc: 'Track issues and sync project status' },
  { id: 'notion', name: 'Notion', icon: '📝', desc: 'Sync knowledge base and create pages' },
  { id: 'vercel', name: 'Vercel', icon: '▲', desc: 'Monitor deployments and build status' },
]

const QUICK_TEMPLATES = [
  { id: 'eng', name: 'Engineering Team', desc: 'Sentry monitoring + PR reviews + incident response', icon: '⚙️', agents: ['Sentry Monitor', 'PR Review Bot', 'Incident Responder'] },
  { id: 'sales', name: 'Sales Team', desc: 'CRM automation + outreach + deal tracking', icon: '📈', agents: ['Sales Outreach Agent', 'Deal Closer'] },
  { id: 'support', name: 'Customer Support', desc: 'Ticket handling + FAQ bot + satisfaction tracking', icon: '🎧', agents: ['Customer Success Agent', 'FAQ Bot'] },
  { id: 'general', name: 'General Assistant', desc: 'Morning briefing + task management + team chat', icon: '✨', agents: ['Morning Briefing Agent', 'Meeting Notes Agent'] },
]

export default function SetupWizardPage() {
  const [step, setStep] = useState(0)
  const [connectedTools, setConnectedTools] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [mode, setMode] = useState<'supervised' | 'autonomous'>('supervised')
  const [complete, setComplete] = useState(false)

  const toggleTool = (id: string) => {
    setConnectedTools(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFinish = () => {
    // Deploy the template agents
    if (selectedTemplate) {
      const tmpl = QUICK_TEMPLATES.find(t => t.id === selectedTemplate)
      if (tmpl) {
        const existing = getAgents()
        const newAgents: Agent[] = tmpl.agents.map((name, i) => ({
          id: `setup-${Date.now()}-${i}`,
          name,
          type: 'sub' as const,
          llm: 'GPT-4',
          status: 'active' as const,
          description: `Deployed via ${tmpl.name} setup template`,
          constraints: [],
          role: tmpl.name,
        }))
        saveAgents([...existing, ...newAgents])
      }
    }
    setComplete(true)
  }

  const steps = [
    { label: 'Connect Tools', icon: Link2 },
    { label: 'Choose Template', icon: Sparkles },
    { label: 'Set Preferences', icon: Settings },
    { label: 'Deploy', icon: Zap },
  ]

  if (complete) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">You're all set! 🎉</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Your AI employees are deployed and running in supervised mode. They'll draft actions for your review before executing.
        </p>
        <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mb-6">
          <p className="text-sm font-medium text-foreground mb-3">What happens next:</p>
          <div className="space-y-2 text-sm text-muted-foreground text-left">
            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Agents start monitoring your connected tools</p>
            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Drafts appear in Supervised AI for your review</p>
            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Chat with agents anytime via Agent Chat</p>
            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Alerts show up in Monitoring when issues arise</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Head to the Command Center to see everything in action</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Quick Setup</h1>
        <p className="text-muted-foreground">Get your AI team running in under 5 minutes</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-6">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === i
            const isDone = step > i
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isDone ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {/* Step 1: Connect Tools */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Connect your tools</h2>
            <p className="text-muted-foreground mb-6">Select which tools your AI employees should monitor. You can add more later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.map(tool => {
                const isConnected = connectedTools.has(tool.id)
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      isConnected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <span className="text-3xl">{tool.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.desc}</p>
                    </div>
                    {isConnected && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Choose Template */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Choose a starting template</h2>
            <p className="text-muted-foreground mb-6">Pick a pre-configured team of AI employees for your use case.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUICK_TEMPLATES.map(tmpl => {
                const isSelected = selectedTemplate === tmpl.id
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{tmpl.icon}</span>
                      <div>
                        <h3 className="font-bold text-foreground">{tmpl.name}</h3>
                        <p className="text-sm text-muted-foreground">{tmpl.desc}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.agents.map(a => (
                        <span key={a} className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg">{a}</span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Set Preferences */}
        {step === 2 && (
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold text-foreground mb-2">Set your preferences</h2>
            <p className="text-muted-foreground mb-6">Configure how your AI employees operate.</p>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">AI Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('supervised')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      mode === 'supervised' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <p className="font-semibold text-foreground mb-1">🛡️ Supervised</p>
                    <p className="text-xs text-muted-foreground">AI drafts actions, you approve before sending. Recommended for getting started.</p>
                  </button>
                  <button
                    onClick={() => setMode('autonomous')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      mode === 'autonomous' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <p className="font-semibold text-foreground mb-1">⚡ Autonomous</p>
                    <p className="text-xs text-muted-foreground">AI executes actions automatically. Use watch rules to set guardrails.</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Notification Channel</label>
                <div className="space-y-2">
                  {['Slack', 'Email', 'In-app only'].map(ch => (
                    <label key={ch} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all">
                      <input type="radio" name="channel" defaultChecked={ch === 'Slack'} className="accent-purple-600" />
                      <span className="text-sm text-foreground">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Working Hours</label>
                <div className="flex items-center gap-3">
                  <input type="time" defaultValue="09:00" className="px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                  <span className="text-sm text-muted-foreground">to</span>
                  <input type="time" defaultValue="18:00" className="px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Agents will only send notifications during these hours</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Deploy */}
        {step === 3 && (
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Ready to deploy</h2>
            <p className="text-muted-foreground mb-6">Your AI team is configured and ready to start working.</p>

            <div className="bg-card border border-border rounded-xl p-6 text-left mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tools connected</span>
                  <span className="font-medium text-foreground">{connectedTools.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium text-foreground">{QUICK_TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="font-medium text-foreground capitalize">{mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agents to deploy</span>
                  <span className="font-medium text-foreground">{QUICK_TEMPLATES.find(t => t.id === selectedTemplate)?.agents.length || 0}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg"
            >
              🚀 Deploy AI Team
            </button>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="border-t border-border bg-card px-6 sm:px-8 py-4 flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {step < 3 && (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
