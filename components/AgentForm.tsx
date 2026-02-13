'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Agent {
  id: string
  name: string
  type: 'main' | 'sub'
  llm: string
  status: 'active' | 'inactive'
  description: string
  constraints: string[]
  role: string
}

interface AgentFormProps {
  agent?: Agent | null
  onSubmit: (data: Omit<Agent, 'id'>) => void
  onCancel: () => void
}

const LLM_OPTIONS = ['GPT-4', 'GPT-3.5', 'Claude 3', 'Claude 2', 'Llama 2', 'Mistral']
const ROLE_OPTIONS = ['Support Manager', 'FAQ Handler', 'Sales Support', 'Technical Lead', 'Custom Role']

export default function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'main' as 'main' | 'sub',
    llm: 'GPT-4',
    status: 'active' as 'active' | 'inactive',
    description: '',
    constraints: [] as string[],
    role: 'Support Manager',
  })
  const [newConstraint, setNewConstraint] = useState('')

  useEffect(() => {
    if (agent) {
      setFormData(agent)
    }
  }, [agent])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'type' || name === 'status') {
      setFormData(prev => ({ ...prev, [name]: value as any }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
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
    if (formData.name.trim()) {
      onSubmit(formData)
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
              <option value="main">Main Agent</option>
              <option value="sub">Sub-Agent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* LLM & Role */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">LLM Model *</label>
            <select
              name="llm"
              value={formData.llm}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              {LLM_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

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
