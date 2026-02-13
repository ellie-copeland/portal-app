'use client'

import { useState } from 'react'
import { Clock, GripVertical } from 'lucide-react'
import { Task } from '@/lib/store'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: Task['status']) => void
}

const COLUMNS = [
  { id: 'todo' as const, title: 'To-Do', color: 'bg-blue-50 dark:bg-blue-950/30', accent: 'border-blue-300 dark:border-blue-700' },
  { id: 'doing' as const, title: 'Doing', color: 'bg-purple-50 dark:bg-purple-950/30', accent: 'border-purple-300 dark:border-purple-700' },
  { id: 'stuck' as const, title: 'Stuck', color: 'bg-yellow-50 dark:bg-yellow-950/30', accent: 'border-yellow-300 dark:border-yellow-700' },
  { id: 'done' as const, title: 'Done', color: 'bg-green-50 dark:bg-green-950/30', accent: 'border-green-300 dark:border-green-700' },
]

export default function KanbanBoard({ tasks, onTaskMove }: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const getTasksByStatus = (status: Task['status']) => tasks.filter(task => task.status === status)

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      case 'doing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
      case 'stuck': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500'
      case 'medium': return 'border-l-4 border-yellow-500'
      case 'low': return 'border-l-4 border-blue-500'
    }
  }

  const getDateColor = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    if (due < today) return 'text-red-500'
    if (due.toDateString() === today.toDateString()) return 'text-orange-500'
    return 'text-muted-foreground'
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null)
    setDragOverColumn(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      onTaskMove(taskId, columnId as Task['status'])
    }
    setDraggedTaskId(null)
    setDragOverColumn(null)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {COLUMNS.map(column => {
        const columnTasks = getTasksByStatus(column.id)
        const isOver = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            className={`${column.color} rounded-xl p-4 min-h-48 sm:min-h-96 border-2 transition-all duration-200 ${
              isOver
                ? `${column.accent} bg-opacity-80 scale-[1.02]`
                : 'border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="mb-4">
              <h3 className="font-semibold text-foreground text-sm uppercase">{column.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{columnTasks.length} tasks</p>
            </div>

            <div className="space-y-3">
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${getPriorityColor(task.priority)} ${
                    draggedTaskId === task.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground mb-2">{task.title}</p>
                      <p className="text-xs text-foreground/70 line-clamp-2 mb-3">{task.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          {task.recurring !== 'none' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              {task.recurring}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">Agent: {task.assignedAgent}</p>

                        <div className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 ${getDateColor(task.dueDate)}`} />
                          <span className={`text-xs ${getDateColor(task.dueDate)}`}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isOver && columnTasks.length === 0 && (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
                  <p className="text-xs text-muted-foreground">Drop here</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
