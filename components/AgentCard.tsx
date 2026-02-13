'use client'

import { Edit2, Trash2, Circle } from 'lucide-react'

interface AgentCardProps {
  agent: {
    id: string
    name: string
    type: 'main' | 'sub'
    llm: string
    status: 'active' | 'inactive'
    description: string
    constraints: string[]
    role: string
  }
  onEdit: () => void
  onDelete: () => void
}

export default function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <div className="border border-border rounded-xl bg-card p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              agent.type === 'main'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
            }`}>
              {agent.type === 'main' ? 'Main' : 'Sub-Agent'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Circle className={`w-3 h-3 ${agent.status === 'active' ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase font-medium">LLM</p>
          <p className="text-sm font-medium text-foreground">{agent.llm}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-medium">Role</p>
          <p className="text-sm font-medium text-foreground">{agent.role}</p>
        </div>
        {agent.constraints.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Constraints</p>
            <div className="flex flex-wrap gap-2">
              {agent.constraints.slice(0, 2).map((constraint, i) => (
                <span key={i} className="text-xs bg-accent text-foreground px-2 py-1 rounded">
                  {constraint}
                </span>
              ))}
              {agent.constraints.length > 2 && (
                <span className="text-xs bg-accent text-foreground px-2 py-1 rounded">
                  +{agent.constraints.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-accent hover:bg-accent/80 text-foreground transition-all"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  )
}
