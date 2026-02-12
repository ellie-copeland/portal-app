'use client'

import { useState } from 'react'

interface Agent {
  id: string
  name: string
  description: string
  children: Agent[]
}

export default function AgentBuilder() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Master Agent',
      description: 'Main orchestration agent',
      children: [
        {
          id: '1.1',
          name: 'Sub-Agent 1',
          description: 'Task execution',
          children: [],
        },
        {
          id: '1.2',
          name: 'Sub-Agent 2',
          description: 'Analysis',
          children: [],
        },
      ],
    },
  ])

  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentDesc, setNewAgentDesc] = useState('')
  const [selectedParent, setSelectedParent] = useState<string | null>(null)

  const addAgent = () => {
    if (!newAgentName.trim() || !selectedParent) {
      alert('Please fill in all fields and select a parent')
      return
    }

    const newAgent: Agent = {
      id: `${selectedParent}.${Date.now()}`,
      name: newAgentName,
      description: newAgentDesc,
      children: [],
    }

    const addToParent = (items: Agent[]): Agent[] => {
      return items.map((item) => {
        if (item.id === selectedParent) {
          return { ...item, children: [...item.children, newAgent] }
        }
        return { ...item, children: addToParent(item.children) }
      })
    }

    setAgents(addToParent(agents))
    setNewAgentName('')
    setNewAgentDesc('')
    setSelectedParent(null)
  }

  const renderAgentTree = (agent: Agent, level: number = 0) => (
    <div key={agent.id} className={`ml-${level * 4}`}>
      <div
        className="p-3 mb-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100"
        onClick={() => setSelectedParent(agent.id)}
      >
        <h4 className="font-semibold text-gray-900">{agent.name}</h4>
        <p className="text-sm text-gray-600">{agent.description}</p>
      </div>
      {agent.children.length > 0 && (
        <div className="ml-4 space-y-2">
          {agent.children.map((child) => renderAgentTree(child, level + 1))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Hierarchy</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {agents.map((agent) => renderAgentTree(agent))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Agent</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Name
            </label>
            <input
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="e.g., Data Processor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newAgentDesc}
              onChange={(e) => setNewAgentDesc(e.target.value)}
              placeholder="What does this agent do?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Agent (Selected: {selectedParent || 'None'})
            </label>
            <p className="text-sm text-gray-600">Click an agent above to select as parent</p>
          </div>

          <button
            onClick={addAgent}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Agent
          </button>
        </div>
      </div>
    </div>
  )
}
