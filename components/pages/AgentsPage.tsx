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
    const onTeamChange = () => fetchAgents()
    window.addEventListener('teamChanged', onTeamChange)
    return () => window.removeEventListener('teamChanged', onTeamChange)
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      const { authHeaders } = await import('@/lib/fetch-auth')
      const res = await fetch('/api/agents', { headers: authHeaders() })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const apiAgents = (data.agents || []).map((a: any) => ({
        ...a,
        status: a.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
        type: a.type?.toLowerCase() || 'sub',
      }))
      setAgents(apiAgents)
      // Also sync localStorage fallback
      if (apiAgents.length > 0) {
        const { saveAgents } = await import('@/lib/store')
        saveAgents(apiAgents)
      }
    } catch {
      // Fallback to localStorage
      try {
        const { getAgents } = await import('@/lib/store')
        setAgents(getAgents())
      } catch { setAgents([]) }
    } finally {
      setLoading(false)
    }
  }

  const handleAddAgent = async (agentData: any) => {
    const { getAgents, saveAgents } = await import('@/lib/store')
    const { authHeaders } = await import('@/lib/fetch-auth')

    try {
      if (editingAgent) {
        const res = await fetch(`/api/agents/${editingAgent.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(agentData) })
        if (!res.ok) throw new Error('API failed')
      } else {
        const res = await fetch('/api/agents', { method: 'POST', headers: authHeaders(), body: JSON.stringify(agentData) })
        if (!res.ok) throw new Error('API failed')
      }
    } catch {
      const all = getAgents()
      if (editingAgent) {
        const idx = all.findIndex(a => a.id === editingAgent.id)
        if (idx >= 0) all[idx] = { ...all[idx], ...agentData }
      } else {
        all.push({ id: Date.now().toString(), status: 'inactive', ...agentData })
      }
      saveAgents(all)
    }

    setEditingAgent(null)
    setShowForm(false)
    await fetchAgents()
  }

  const handleToggleStatus = async (agent: any) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active'
    const dbStatus = newStatus.toUpperCase()
    const { authHeaders } = await import('@/lib/fetch-auth')
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: dbStatus }),
      })
      if (!res.ok) throw new Error('API failed')
    } catch {
      const { getAgents, saveAgents } = await import('@/lib/store')
      const all = getAgents()
      const idx = all.findIndex(a => a.id === agent.id)
      if (idx >= 0) { all[idx].status = newStatus; saveAgents(all) }
    }
    await fetchAgents()
  }

  const handleDeleteAgent = async (id: string) => {
    const { authHeaders } = await import('@/lib/fetch-auth')
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error('API failed')
    } catch {
      const { getAgents, saveAgents } = await import('@/lib/store')
      const all = getAgents().filter(a => a.id !== id)
      saveAgents(all)
    }
    await fetchAgents()
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
            <p className="text-sm text-foreground/70 font-medium">Total Agents</p>
            <p className="text-2xl font-bold text-foreground">{agents.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-sm text-foreground/70 font-medium">Active</p>
            <p className="text-2xl font-bold text-foreground">{agents.filter(a => a.status === 'active').length}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <p className="text-sm text-foreground/70 font-medium">Models Used</p>
            <p className="text-2xl font-bold text-foreground">{new Set(agents.map(a => a.llm)).size}</p>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(agent)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        agent.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                          : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      {agent.status === 'active' ? 'Active' : 'Activate'}
                    </button>
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
                  <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                    agent.type === 'main' 
                      ? 'bg-purple-600 text-white border-purple-700' 
                      : 'bg-muted text-foreground/70 border-border'
                  }`}>{agent.type === 'main' ? 'Main' : 'Sub'}</span>
                  <span className="text-xs bg-muted text-foreground/70 px-2.5 py-1 rounded-md font-medium border border-border flex items-center gap-1">
                    <Cpu className="w-3 h-3" />{agent.llm}
                  </span>
                  <span className="text-xs bg-muted text-foreground/70 px-2.5 py-1 rounded-md font-medium border border-border">{agent.role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
