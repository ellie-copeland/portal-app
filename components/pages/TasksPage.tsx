'use client'

import { useState, useEffect } from 'react'
import { Calendar, Grid3X3, Filter } from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import CalendarView from '@/components/CalendarView'
import TaskFilters from '@/components/TaskFilters'
import { Task, getTasks, saveTasks } from '@/lib/store'

export type ViewType = 'kanban' | 'calendar'

export default function TasksPage() {
  const [view, setView] = useState<ViewType>('kanban')
  const [tasks, setTasks] = useState<Task[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    recurring: 'all' as 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    scheduled: 'all' as 'all' | 'scheduled' | 'unscheduled',
    agent: 'all',
  })

  useEffect(() => { setTasks(getTasks()) }, [])

  useEffect(() => {
    if (tasks.length > 0) saveTasks(tasks)
  }, [tasks])

  const filteredTasks = tasks.filter(task => {
    if (filters.recurring !== 'all' && task.recurring !== filters.recurring) return false
    if (filters.scheduled !== 'all') {
      if (filters.scheduled === 'scheduled' && !task.scheduled) return false
      if (filters.scheduled === 'unscheduled' && task.scheduled) return false
    }
    if (filters.agent !== 'all' && task.assignedAgent !== filters.agent) return false
    return true
  })

  const handleTaskMove = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setShowFilters(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Tasks</h1>
            <p className="text-muted-foreground">Manage tasks and track progress</p>
          </div>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 border border-border rounded-xl p-1 bg-background">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                view === 'kanban'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                view === 'calendar'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl bg-background text-foreground hover:bg-accent transition-all text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b border-border bg-card px-4 sm:px-8 py-4">
          <TaskFilters
            filters={filters}
            onApply={handleApplyFilters}
            agents={Array.from(new Set(tasks.map(t => t.assignedAgent)))}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        {view === 'kanban' ? (
          <KanbanBoard tasks={filteredTasks} onTaskMove={handleTaskMove} />
        ) : (
          <CalendarView tasks={filteredTasks} />
        )}
      </div>
    </div>
  )
}
