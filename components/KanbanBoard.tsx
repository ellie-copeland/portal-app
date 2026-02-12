'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState({
    todo: [
      { id: '1', title: 'Setup database', description: 'Initialize Supabase' },
      { id: '2', title: 'Design UI', description: 'Create mockups' },
    ],
    doing: [
      { id: '3', title: 'Build API', description: 'Implement REST endpoints' },
    ],
    stuck: [
      { id: '4', title: 'LLM integration', description: 'OpenRouter API setup' },
    ],
  })

  const [newTask, setNewTask] = useState('')
  const [newTaskColumn, setNewTaskColumn] = useState<keyof typeof columns>('todo')

  const addTask = () => {
    if (!newTask.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      description: '',
    }

    setColumns({
      ...columns,
      [newTaskColumn]: [...columns[newTaskColumn], task],
    })
    setNewTask('')
  }

  const moveTask = (taskId: string, fromColumn: keyof typeof columns, toColumn: keyof typeof columns) => {
    const task = columns[fromColumn].find((t) => t.id === taskId)
    if (!task) return

    setColumns({
      ...columns,
      [fromColumn]: columns[fromColumn].filter((t) => t.id !== taskId),
      [toColumn]: [...columns[toColumn], task],
    })
  }

  const renderColumn = (columnKey: keyof typeof columns, columnTitle: string) => (
    <div key={columnKey} className="flex flex-col bg-gray-100 rounded-lg p-4 min-w-80">
      <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm">{columnTitle}</h3>
      <div className="flex-1 space-y-3">
        {columns[columnKey].map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id)
              e.dataTransfer.setData('fromColumn', columnKey)
            }}
            className="p-3 bg-white rounded-lg shadow hover:shadow-md cursor-move"
          >
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const taskId = e.dataTransfer.getData('taskId')
          const fromColumn = e.dataTransfer.getData('fromColumn') as keyof typeof columns
          moveTask(taskId, fromColumn, columnKey)
        }}
        className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-600 min-h-20"
      >
        Drop tasks here
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Task</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Task title..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={newTaskColumn}
            onChange={(e) => setNewTaskColumn(e.target.value as keyof typeof columns)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="todo">To-Do</option>
            <option value="doing">Doing</option>
            <option value="stuck">Stuck</option>
          </select>
          <button
            onClick={addTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {renderColumn('todo', 'To-Do')}
        {renderColumn('doing', 'Doing')}
        {renderColumn('stuck', 'Stuck')}
      </div>
    </div>
  )
}
