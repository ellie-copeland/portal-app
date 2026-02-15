'use client'

import { useState, useEffect } from 'react'
import { Calendar, Grid3X3, Filter, Plus, X } from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import CalendarView from '@/components/CalendarView'
import TaskFilters from '@/components/TaskFilters'
import { Task, getTasks, saveTasks } from '@/lib/store'

export type ViewType = 'kanban' | 'calendar'

function normalizeTask(t: any): Task {
  return {
    id: t.id,
    title: t.title || '',
    description: t.description || '',
    status: (t.status || 'todo').toLowerCase() as Task['status'],
    assignedAgent: t.assignedAgent || t.agent?.name || 'Unassigned',
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    recurring: (t.recurring || 'none').toLowerCase() as Task['recurring'],
    scheduled: !!t.scheduled,
    createdAt: t.createdAt || new Date().toISOString(),
    priority: (t.priority || 'medium').toLowerCase() as Task['priority'],
  }
}

export default function TasksPage() {
  const [view, setView] = useState<ViewType>('kanban')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
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
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const apiTasks = (data.tasks || []).map(normalizeTask)
      if (apiTasks.length > 0) {
        setTasks(apiTasks)
        saveTasks(apiTasks)
      } else {
        // Empty DB — use localStorage
        setTasks(getTasks())
      }
    } catch {
      // API failed — fall back to localStorage
      setTasks(getTasks())
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
    // Optimistic update
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    setTasks(updated)
    saveTasks(updated)

    try {
      const { authHeaders: getAuth } = await import('@/lib/fetch-auth')
      const headers = getAuth()
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      })
    } catch {
      // localStorage already saved — silent fail on API
    }
  }

  const handleCreateTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...tasks, newTask]
    setTasks(updated)
    saveTasks(updated)
    setShowCreate(false)

    try {
      const { authHeaders: getAuth } = await import('@/lib/fetch-auth')
      const headers = getAuth()
      await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status.toUpperCase(),
          priority: task.priority.toUpperCase(),
          recurring: task.recurring,
          scheduled: task.scheduled,
          dueDate: task.dueDate || undefined,
        }),
      })
    } catch {
      // localStorage already saved
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId)
    setTasks(updated)
    saveTasks(updated)

    try {
      const { authHeaders: getAuth } = await import('@/lib/fetch-auth')
      const headers = getAuth()
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers })
    } catch {}
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
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
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

      {/* Create Task Modal */}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateTask}
        />
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
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
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

// --- Create Task Modal ---

function CreateTaskModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (task: Omit<Task, 'id' | 'createdAt'>) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [assignedAgent, setAssignedAgent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurring, setRecurring] = useState<Task['recurring']>('none')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignedAgent: assignedAgent.trim() || 'Unassigned',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      recurring,
      scheduled: recurring !== 'none',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Task['status'])} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="todo">To-Do</option>
                <option value="doing">Doing</option>
                <option value="stuck">Stuck</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Assigned Agent</label>
              <input
                value={assignedAgent}
                onChange={e => setAssignedAgent(e.target.value)}
                placeholder="Agent name"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Recurring</label>
            <select value={recurring} onChange={e => setRecurring(e.target.value as Task['recurring'])} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-accent transition-all text-sm">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
