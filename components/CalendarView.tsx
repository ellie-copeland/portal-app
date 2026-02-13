'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

interface CalendarViewProps {
  tasks: Task[]
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 1, 1))

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const days: (number | null)[] = []
  // Add empty cells for days before the month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  // Add actual days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getTasksForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return tasks.filter(task => task.dueDate === dateStr)
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-accent rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-accent rounded-lg transition-all"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-2 font-semibold text-sm text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-24 p-2 border border-border rounded-lg ${
              day ? 'bg-background hover:bg-accent transition-colors' : 'bg-muted'
            }`}
          >
            {day && (
              <div className="h-full flex flex-col">
                <p className="font-semibold text-sm text-foreground mb-1">{day}</p>
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {getTasksForDate(day).map(task => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded text-white truncate ${
                        task.status === 'done'
                          ? 'bg-green-500'
                          : task.status === 'doing'
                            ? 'bg-purple-500'
                            : task.status === 'stuck'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="font-semibold text-sm text-foreground mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">To-Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Doing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Stuck</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Done</span>
          </div>
        </div>
      </div>
    </div>
  )
}
