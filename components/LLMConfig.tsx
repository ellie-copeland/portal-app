'use client'

import { useState } from 'react'

interface AgentLLMConfig {
  agentId: string
  agentName: string
  model: string
  temperature: number
  contextWindow: number
  systemPrompt: string
}

export default function LLMConfig() {
  const [configs, setConfigs] = useState<AgentLLMConfig[]>([
    {
      agentId: '1',
      agentName: 'Master Agent',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      contextWindow: 8000,
      systemPrompt: 'You are a helpful agent coordinator.',
    },
    {
      agentId: '2',
      agentName: 'Data Agent',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      contextWindow: 4000,
      systemPrompt: 'You are a data analysis specialist.',
    },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editConfig, setEditConfig] = useState<AgentLLMConfig | null>(null)

  const startEdit = (config: AgentLLMConfig) => {
    setEditingId(config.agentId)
    setEditConfig({ ...config })
  }

  const saveConfig = () => {
    if (!editConfig) return
    setConfigs(
      configs.map((c) => (c.agentId === editConfig.agentId ? editConfig : c))
    )
    setEditingId(null)
    setEditConfig(null)
  }

  const models = [
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { label: 'Llama 2', value: 'llama-2-70b' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">LLM Configuration</h2>

        <div className="space-y-6">
          {configs.map((config) => (
            <div
              key={config.agentId}
              className="border border-gray-200 rounded-lg p-4"
            >
              {editingId === config.agentId && editConfig ? (
                // Edit Mode
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Edit: {editConfig.agentName}</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <select
                        value={editConfig.model}
                        onChange={(e) =>
                          setEditConfig({ ...editConfig, model: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {models.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature ({editConfig.temperature})
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={editConfig.temperature}
                        onChange={(e) =>
                          setEditConfig({
                            ...editConfig,
                            temperature: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Context Window
                      </label>
                      <input
                        type="number"
                        value={editConfig.contextWindow}
                        onChange={(e) =>
                          setEditConfig({
                            ...editConfig,
                            contextWindow: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      System Prompt
                    </label>
                    <textarea
                      value={editConfig.systemPrompt}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          systemPrompt: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={saveConfig}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">{config.agentName}</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Model:</span> {config.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Temperature:</span> {config.temperature}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Context:</span> {config.contextWindow}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Prompt:</span> {config.systemPrompt}
                  </p>
                  <button
                    onClick={() => startEdit(config)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
