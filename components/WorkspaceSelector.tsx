'use client'

import { useState } from 'react'

interface Workspace {
  id: string
  name: string
}

export default function WorkspaceSelector() {
  const [workspaces] = useState<Workspace[]>([
    { id: '1', name: 'Main Workspace' },
    { id: '2', name: 'Development' },
    { id: '3', name: 'Staging' },
  ])

  const [activeWorkspace, setActiveWorkspace] = useState('1')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspace)

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Workspace</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Workspace
          </label>
          <div className="flex space-x-2">
            <select
              value={activeWorkspace}
              onChange={(e) => setActiveWorkspace(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Active: <span className="font-medium">{currentWorkspace?.name}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Create New Workspace
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">All Workspaces</h3>
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                  activeWorkspace === ws.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
                onClick={() => setActiveWorkspace(ws.id)}
              >
                <p className="font-medium text-gray-900">{ws.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
