'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Agent {
  id: string
  name: string
  type: 'MAIN' | 'SUB' | 'main' | 'sub'
  model?: string
  llm?: string
  status?: 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE'
  description?: string
  constraints?: string[]
  role?: string
  persona?: string
  avatarUrl?: string
}

interface AgentFormProps {
  agent?: Agent | null
  onSubmit: (data: Record<string, any>) => void
  onCancel: () => void
}

// Models grouped by provider — shown based on which API key the user has configured
const MODEL_OPTIONS: Record<string, { label: string; models: string[] }> = {
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o1-pro'],
  },
  anthropic: {
    label: 'Anthropic',
    models: ['claude-opus-4', 'claude-sonnet-4', 'claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-opus'],
  },
  google: {
    label: 'Google',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  },
  meta: {
    label: 'Meta (via OpenRouter/Ollama)',
    models: ['llama-3.3-70b', 'llama-3.1-405b', 'llama-3.1-70b', 'llama-3.1-8b'],
  },
  mistral: {
    label: 'Mistral',
    models: ['mistral-large', 'mistral-medium', 'mistral-small', 'mixtral-8x22b', 'codestral'],
  },
  openrouter: {
    label: 'OpenRouter (any model)',
    models: ['openrouter/auto'],
  },
}

// Map provider keys to MODEL_OPTIONS keys that should be visible
const PROVIDER_TO_MODEL_GROUPS: Record<string, string[]> = {
  openai: ['openai'],
  anthropic: ['anthropic'],
  google: ['google'],
  openrouter: ['openai', 'anthropic', 'google', 'meta', 'mistral', 'openrouter'],
}

const ROLE_OPTIONS = ['Support Manager', 'FAQ Handler', 'Sales Support', 'Technical Lead', 'Custom Role']

export default function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const [userProviders, setUserProviders] = useState<string[]>([])

  // Fetch user's configured API key providers
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const teamId = localStorage.getItem('activeTeamId')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (teamId) headers['X-Team-Id'] = teamId
        const res = await fetch('/api/keys', { headers })
        if (res.ok) {
          const data = await res.json()
          const providers = (data.keys || []).map((k: { provider: string }) => k.provider)
          setUserProviders(providers)
        }
      } catch {}
    }
    fetchKeys()
  }, [])

  // When providers load, update default model to first available if current isn't in the list
  useEffect(() => {
    if (userProviders.length > 0 && !agent) {
      const visibleGroups = new Set<string>()
      userProviders.forEach(p => {
        const groups = PROVIDER_TO_MODEL_GROUPS[p] || [p]
        groups.forEach(g => visibleGroups.add(g))
      })
      const firstGroup = Object.entries(MODEL_OPTIONS).find(([key]) => visibleGroups.has(key))
      if (firstGroup && firstGroup[1].models.length > 0) {
        const firstModel = firstGroup[1].models[0]
        setFormData(prev => {
          // Only update if current model isn't in any visible group
          const allVisible = Object.entries(MODEL_OPTIONS)
            .filter(([key]) => visibleGroups.has(key))
            .flatMap(([, g]) => g.models)
          if (!allVisible.includes(prev.model)) {
            return { ...prev, model: firstModel }
          }
          return prev
        })
      }
    }
  }, [userProviders, agent])

  // Filter MODEL_OPTIONS based on user's configured providers
  const filteredModelOptions = (() => {
    if (userProviders.length === 0) return MODEL_OPTIONS // show all if no keys yet (or still loading)
    const visibleGroups = new Set<string>()
    userProviders.forEach(p => {
      const groups = PROVIDER_TO_MODEL_GROUPS[p] || [p]
      groups.forEach(g => visibleGroups.add(g))
    })
    const filtered: Record<string, { label: string; models: string[] }> = {}
    for (const [key, group] of Object.entries(MODEL_OPTIONS)) {
      if (visibleGroups.has(key)) filtered[key] = group
    }
    return Object.keys(filtered).length > 0 ? filtered : MODEL_OPTIONS
  })()

  const [formData, setFormData] = useState({
    name: '',
    type: 'MAIN' as 'MAIN' | 'SUB',
    model: 'gpt-4o-mini',
    description: '',
    constraints: [] as string[],
    role: 'Support Manager',
    persona: '',
    avatarUrl: '',
  })
  const [newConstraint, setNewConstraint] = useState('')

  useEffect(() => {
    if (agent) {
      // Normalize agent data: convert llm->model, uppercase type
      setFormData({
        name: agent.name || '',
        type: (agent.type === 'main' ? 'MAIN' : agent.type === 'sub' ? 'SUB' : agent.type) as 'MAIN' | 'SUB',
        model: agent.model || agent.llm || '',
        description: agent.description || '',
        constraints: agent.constraints || [],
        role: agent.role || 'Support Manager',
        persona: (agent as any).persona || '',
        avatarUrl: (agent as any).avatarUrl || '',
      })
    }
  }, [agent])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddConstraint = () => {
    if (newConstraint.trim()) {
      setFormData(prev => ({
        ...prev,
        constraints: [...prev.constraints, newConstraint]
      }))
      setNewConstraint('')
    }
  }

  const handleRemoveConstraint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim()
    if (formData.name.trim()) {
      // Map form data to API schema
      onSubmit({
        name: sanitize(formData.name).slice(0, 100),
        type: formData.type, // Already uppercase (MAIN/SUB)
        model: formData.model,
        description: formData.description,
        constraints: formData.constraints,
        role: formData.role,
        ...(formData.persona && { persona: formData.persona }),
        ...(formData.avatarUrl && { avatarUrl: formData.avatarUrl }),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {agent ? 'Edit Agent' : 'Create New Agent'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-accent rounded-lg transition-all"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Agent Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Customer Support Bot"
            className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground"
            required
          />
        </div>

        {/* Type */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Agent Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="MAIN">Main Agent</option>
              <option value="SUB">Sub-Agent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Model *</label>
            <select
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              {Object.entries(filteredModelOptions).map(([key, group]) => (
                <optgroup key={key} label={group.label}>
                  {group.models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Persona */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Persona (Optional)</label>
          <textarea
            name="persona"
            value={formData.persona}
            onChange={handleChange}
            placeholder="Describe the personality and style of this agent..."
            rows={2}
            className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground resize-none"
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Avatar URL (Optional)</label>
          <input
            type="url"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/avatar.png"
            className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what this agent does..."
            rows={3}
            className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground resize-none"
          />
        </div>

        {/* Constraints */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Constraints</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newConstraint}
              onChange={(e) => setNewConstraint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddConstraint())}
              placeholder="Add a constraint..."
              className="flex-1 px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground"
            />
            <button
              type="button"
              onClick={handleAddConstraint}
              className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-foreground font-medium transition-all"
            >
              Add
            </button>
          </div>

          {formData.constraints.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.constraints.map((constraint, index) => (
                <div key={index} className="flex items-center gap-2 bg-accent px-3 py-1 rounded-lg text-sm text-foreground">
                  {constraint}
                  <button
                    type="button"
                    onClick={() => handleRemoveConstraint(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-input bg-background rounded-lg text-foreground font-medium hover:bg-accent transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          {agent ? 'Update Agent' : 'Create Agent'}
        </button>
      </div>
    </form>
  )
}
