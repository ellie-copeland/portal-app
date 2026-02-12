'use client'

import { useState } from 'react'

interface UsageMetric {
  agentId: string
  agentName: string
  tokensUsed: number
  apiCalls: number
  cost: number
}

export default function UsageDashboard() {
  const [metrics] = useState<UsageMetric[]>([
    {
      agentId: '1',
      agentName: 'Master Agent',
      tokensUsed: 45000,
      apiCalls: 120,
      cost: 0.85,
    },
    {
      agentId: '2',
      agentName: 'Data Agent',
      tokensUsed: 32000,
      apiCalls: 85,
      cost: 0.48,
    },
    {
      agentId: '3',
      agentName: 'Analysis Agent',
      tokensUsed: 18500,
      apiCalls: 42,
      cost: 0.28,
    },
  ])

  const totalTokens = metrics.reduce((sum, m) => sum + m.tokensUsed, 0)
  const totalCalls = metrics.reduce((sum, m) => sum + m.apiCalls, 0)
  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Tokens</h3>
          <p className="text-3xl font-bold text-blue-600">{totalTokens.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">API Calls</h3>
          <p className="text-3xl font-bold text-green-600">{totalCalls}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Cost</h3>
          <p className="text-3xl font-bold text-purple-600">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Usage Details</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Agent
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  Tokens Used
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  API Calls
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  Cost ($)
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.agentId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{metric.agentName}</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {metric.tokensUsed.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {metric.apiCalls}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 font-medium">
                    ${metric.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-right">{totalTokens.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">{totalCalls}</td>
                <td className="py-3 px-4 text-right">${totalCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Usage Trend</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  )
}
