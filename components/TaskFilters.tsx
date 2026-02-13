'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface TaskFiltersProps {
  filters: {
    recurring: 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    scheduled: 'all' | 'scheduled' | 'unscheduled'
    agent: string
  }
  onApply: (filters: TaskFiltersProps['filters']) => void
  agents: string[]
}

export default function TaskFilters({ filters, onApply, agents }: TaskFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    const defaultFilters = {
      recurring: 'all' as const,
      scheduled: 'all' as const,
      agent: 'all',
    }
    setLocalFilters(defaultFilters)
    onApply(defaultFilters)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Recurring Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Recurring</label>
          <select
            value={localFilters.recurring}
            onChange={(e) => handleChange('recurring', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Tasks</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Scheduled Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Schedule</label>
          <select
            value={localFilters.scheduled}
            onChange={(e) => handleChange('scheduled', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Tasks</option>
            <option value="scheduled">Scheduled</option>
            <option value="unscheduled">Unscheduled</option>
          </select>
        </div>

        {/* Agent Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Agent</label>
          <select
            value={localFilters.agent}
            onChange={(e) => handleChange('agent', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          Reset
        </button>
        <button
          onClick={() => onApply(localFilters)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}
