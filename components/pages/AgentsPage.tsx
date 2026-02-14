'use client'

import { useState, useEffect } from 'react'
import { Plus, Bot, Cpu, Pencil, Trash2 } from 'lucide-react'
import AgentForm from '@/components/AgentForm'

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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
      const res = await fetch('/api/agents', { headers })
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (err) {
      console.error('Error fetching agents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAgent = async (agentData: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      let res
      if (editingAgent) {
        res = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(agentData),
        })
      } else {
        res = await fetch('/api/agents', {
          method: 'POST',
          headers,
          body: JSON.stringify(agentData),
        })
      }

      if (!res.ok) throw new Error('Failed to save agent')
      
      setEditingAgent(null)
      setShowForm(false)
      await fetchAgents()
    } catch (err) {
      console.error('Error saving agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to save agent')
    }
  }

  const handleDeleteAgent = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
      
      const res = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
        headers,
      })
      
      if (!res.ok) throw new Error('Failed to delete agent')
      await fetchAgents()
    } catch (err) {
      console.error('Error deleting agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Agents</h1>
            <p className="text-muted-foreground">Create and manage your AI employees</p>
          </div>
          <button
            onClick={() => { setEditingAgent(null); setShowForm(!showForm) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-sm text-purple-600 font-medium">Total Agents</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{agents.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-sm text-emerald-600 font-medium">Active</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{agents.filter(a => a.status === 'active').length}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <p className="text-sm text-teal-600 font-medium">Models Used</p>
            <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{new Set(agents.map(a => a.llm)).size}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : showForm ? (
          <div className="max-w-2xl">
            <AgentForm
              agent={editingAgent}
              onSubmit={handleAddAgent}
              onCancel={() => { setShowForm(false); setEditingAgent(null) }}
            />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">Create your first AI employee to start monitoring tools, responding to messages, and automating workflows.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium"
            >
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map(agent => (
              <div key={agent.id} className="bg-card border border-border/80 rounded-xl p-6 hover:shadow-lg transition-all group shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      agent.status === 'active' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Bot className={`w-5 h-5 ${agent.status === 'active' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        agent.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingAgent(agent); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground/70 mb-4">{agent.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg font-semibold border border-purple-200 dark:border-purple-800">{agent.type}</span>
                  <span className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-lg font-semibold border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                    <Cpu className="w-3 h-3" />{agent.llm}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-700">{agent.role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
