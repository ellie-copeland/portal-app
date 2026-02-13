'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, Zap, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface UsageEntry {
  date: string
  agent: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  executions: number
}

interface AgentCost {
  name: string
  totalCost: number
  executions: number
  avgCostPerExec: number
  trend: 'up' | 'down' | 'flat'
  trendPercent: number
}

const MOCK_USAGE: UsageEntry[] = [
  { date: 'Today', agent: 'Customer Support', model: 'GPT-4', inputTokens: 45200, outputTokens: 12800, cost: 1.42, executions: 34 },
  { date: 'Today', agent: 'Sentry Monitor', model: 'Claude 3.5', inputTokens: 22100, outputTokens: 8900, cost: 0.89, executions: 12 },
  { date: 'Today', agent: 'Sales Assistant', model: 'GPT-4', inputTokens: 18700, outputTokens: 6200, cost: 0.62, executions: 8 },
  { date: 'Today', agent: 'Code Reviewer', model: 'Claude 3.5', inputTokens: 67400, outputTokens: 15800, cost: 2.31, executions: 5 },
  { date: 'Today', agent: 'Morning Briefing', model: 'GPT-4', inputTokens: 89200, outputTokens: 24500, cost: 3.12, executions: 1 },
  { date: 'Yesterday', agent: 'Customer Support', model: 'GPT-4', inputTokens: 52100, outputTokens: 14200, cost: 1.63, executions: 41 },
  { date: 'Yesterday', agent: 'Sentry Monitor', model: 'Claude 3.5', inputTokens: 18900, outputTokens: 7100, cost: 0.74, executions: 9 },
]

const MOCK_AGENT_COSTS: AgentCost[] = [
  { name: 'Morning Briefing', totalCost: 3.12, executions: 1, avgCostPerExec: 3.12, trend: 'down', trendPercent: 8 },
  { name: 'Code Reviewer', totalCost: 2.31, executions: 5, avgCostPerExec: 0.46, trend: 'up', trendPercent: 12 },
  { name: 'Customer Support', totalCost: 1.42, executions: 34, avgCostPerExec: 0.04, trend: 'down', trendPercent: 5 },
  { name: 'Sentry Monitor', totalCost: 0.89, executions: 12, avgCostPerExec: 0.07, trend: 'flat', trendPercent: 0 },
  { name: 'Sales Assistant', totalCost: 0.62, executions: 8, avgCostPerExec: 0.08, trend: 'up', trendPercent: 15 },
]

const DAILY_COSTS = [
  { day: 'Mon', cost: 6.82 },
  { day: 'Tue', cost: 8.14 },
  { day: 'Wed', cost: 5.91 },
  { day: 'Thu', cost: 7.23 },
  { day: 'Fri', cost: 9.47 },
  { day: 'Sat', cost: 3.21 },
  { day: 'Sun', cost: 2.87 },
]

export default function BillingPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

  const todayCost = MOCK_USAGE.filter(u => u.date === 'Today').reduce((sum, u) => sum + u.cost, 0)
  const todayTokens = MOCK_USAGE.filter(u => u.date === 'Today').reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0)
  const todayExecs = MOCK_USAGE.filter(u => u.date === 'Today').reduce((sum, u) => sum + u.executions, 0)
  const weekCost = DAILY_COSTS.reduce((sum, d) => sum + d.cost, 0)
  const maxDailyCost = Math.max(...DAILY_COSTS.map(d => d.cost))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Usage & Billing</h1>
            <p className="text-muted-foreground">Track costs, token usage, and spending by agent</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-200" />
              <p className="text-sm text-purple-100 font-medium">Today&apos;s Spend</p>
            </div>
            <p className="text-3xl font-bold">${todayCost.toFixed(2)}</p>
            <p className="text-sm text-purple-200 mt-1">↓ 12% vs yesterday</p>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-teal-200" />
              <p className="text-sm text-teal-100 font-medium">Weekly Spend</p>
            </div>
            <p className="text-3xl font-bold">${weekCost.toFixed(2)}</p>
            <p className="text-sm text-teal-200 mt-1">On track for $185/mo</p>
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-sky-200" />
              <p className="text-sm text-sky-100 font-medium">Tokens Used</p>
            </div>
            <p className="text-3xl font-bold">{(todayTokens / 1000).toFixed(0)}k</p>
            <p className="text-sm text-sky-200 mt-1">{todayExecs} executions</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-violet-200" />
              <p className="text-sm text-violet-100 font-medium">Avg per Execution</p>
            </div>
            <p className="text-3xl font-bold">${(todayCost / todayExecs).toFixed(3)}</p>
            <p className="text-sm text-violet-200 mt-1">{(todayTokens / todayExecs).toFixed(0)} tokens avg</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Daily Cost Chart */}
          <div className="col-span-2 bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Daily Cost (This Week)</h2>
            <div className="flex items-end gap-3 h-48">
              {DAILY_COSTS.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">${d.cost.toFixed(2)}</span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-teal-400 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(d.cost / maxDailyCost) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost by Agent */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Cost by Agent</h2>
            <div className="space-y-4">
              {MOCK_AGENT_COSTS.map(agent => (
                <div key={agent.name} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                      {agent.trend === 'up' && (
                        <span className="flex items-center text-xs text-red-500">
                          <ArrowUpRight className="w-3 h-3" />
                          {agent.trendPercent}%
                        </span>
                      )}
                      {agent.trend === 'down' && (
                        <span className="flex items-center text-xs text-emerald-500">
                          <ArrowDownRight className="w-3 h-3" />
                          {agent.trendPercent}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{agent.executions} runs · ${agent.avgCostPerExec.toFixed(3)}/run</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">${agent.totalCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Table */}
          <div className="col-span-3 bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Detailed Usage</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Input Tokens</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Output Tokens</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Executions</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USAGE.map((entry, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{entry.date}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{entry.agent}</td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{entry.model}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-muted-foreground">{entry.inputTokens.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-muted-foreground">{entry.outputTokens.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-muted-foreground">{entry.executions}</td>
                    <td className="px-6 py-3.5 text-sm text-right font-semibold text-foreground">${entry.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
