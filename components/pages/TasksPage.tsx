'use client'

import { useState, useEffect } from 'react'
import { Calendar, Grid3X3, Filter } from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import CalendarView from '@/components/CalendarView'
import TaskFilters from '@/components/TaskFilters'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'stuck' | 'done'
  assignedAgent: string
  dueDate: string
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  scheduled: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high'
}

export type ViewType = 'kanban' | 'calendar'

export default function TasksPage() {
  const [view, setView] = useState<ViewType>('kanban')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    recurring: 'all' as 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    scheduled: 'all' as 'all' | 'scheduled' | 'unscheduled',
    agent: 'all',
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const { authHeaders: getAuth } = await import('@/lib/fetch-auth')
      const headers = getAuth()
      const res = await fetch('/api/tasks', { headers })
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filters.recurring !== 'all' && task.recurring !== filters.recurring) return false
    if (filters.scheduled !== 'all') {
      if (filters.scheduled === 'scheduled' && !task.scheduled) return false
      if (filters.scheduled === 'unscheduled' && task.scheduled) return false
    }
    if (filters.agent !== 'all' && task.assignedAgent !== filters.agent) return false
    return true
  })

  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { authHeaders: getAuth } = await import('@/lib/fetch-auth')
      const headers = getAuth()
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) throw new Error('Failed to update task')
      await fetchTasks()
    } catch (err) {
      console.error('Error updating task:', err)
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
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

      {/* Error Alert */}
      {error && (
        <div className="mx-4 sm:mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
              <Grid3X3 className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">Create your first task to start tracking work.</p>
          </div>
        ) : (
          <>
            {view === 'kanban' ? (
              <KanbanBoard tasks={filteredTasks} onTaskMove={handleTaskMove} />
            ) : (
              <CalendarView tasks={filteredTasks} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
