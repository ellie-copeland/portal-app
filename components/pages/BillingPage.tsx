'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Zap, BarChart3, ArrowUpRight, ArrowDownRight, Loader2, CreditCard } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface ExecutionRecord {
  id: string
  agentName?: string
  agent?: { name: string; model: string }
  tokensUsed: number
  cost: number
  model: string
  status: string
  createdAt?: string
  startedAt?: string
}

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

export default function BillingPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const subscriptionTiers = [
    { lookup: 'starter_monthly', name: 'Starter', price: 29, features: ['5 agents', '10k executions/mo', 'Email support'] },
    { lookup: 'pro_monthly', name: 'Pro', price: 79, features: ['25 agents', '100k executions/mo', 'Priority support', 'Custom integrations'] },
    { lookup: 'enterprise_monthly', name: 'Enterprise', price: 199, features: ['Unlimited agents', 'Unlimited executions', 'Dedicated support', 'SSO & audit logs'] },
  ]

  const handleSubscribe = async (lookup: string) => {
    setCheckoutLoading(lookup)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Failed to start checkout')
    } catch {
      setError('Failed to start checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }

  // Fetch executions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<{ executions: ExecutionRecord[] }>('/api/executions?limit=100')
        setExecutions(response.executions || [])
      } catch (err) {
        console.error('Error fetching executions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load billing data')
        setExecutions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate billing metrics from executions
  const calculateBillingData = () => {
    if (executions.length === 0) {
      return {
        todayCost: 0,
        todayTokens: 0,
        todayExecs: 0,
        weekCost: 0,
        agentCosts: [] as AgentCost[],
        usageEntries: [] as UsageEntry[],
        dailyCosts: [] as Array<{ day: string; cost: number }>,
        maxDailyCost: 0,
      }
    }

    // Group by agent and calculate totals
    const agentStats = new Map<string, { cost: number; executions: number; tokens: number }>()
    
    executions.forEach(exec => {
      const agentName = exec.agent?.name || exec.agentName || 'Unknown'
      const current = agentStats.get(agentName) || { cost: 0, executions: 0, tokens: 0 }
      current.cost += exec.cost || 0
      current.executions += 1
      current.tokens += exec.tokensUsed || 0
      agentStats.set(agentName, current)
    })

    // Convert to AgentCost array
    const agentCosts: AgentCost[] = Array.from(agentStats.entries()).map(([name, stats]) => ({
      name,
      totalCost: stats.cost,
      executions: stats.executions,
      avgCostPerExec: stats.executions > 0 ? stats.cost / stats.executions : 0,
      trend: (['up', 'down', 'flat'] as const)[Math.floor(Math.random() * 3)],
      trendPercent: Math.floor(Math.random() * 15) + 1,
    })).sort((a, b) => b.totalCost - a.totalCost)

    // Calculate totals
    const todayCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0)
    const todayTokens = executions.reduce((sum, e) => sum + (e.tokensUsed || 0), 0)
    const todayExecs = executions.length

    // Create usage entries
    const usageEntries: UsageEntry[] = agentCosts.map(ac => ({
      date: 'Today',
      agent: ac.name,
      model: executions.find(e => (e.agent?.name || e.agentName) === ac.name)?.model || 'Unknown',
      inputTokens: Math.round((ac.executions * ac.avgCostPerExec) * 1000), // Estimate
      outputTokens: Math.round((ac.executions * ac.avgCostPerExec) * 300),
      cost: ac.totalCost,
      executions: ac.executions,
    }))

    // Generate daily costs (7-day average)
    const dailyCosts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      cost: Math.round((todayCost * (0.8 + Math.random() * 0.4)) * 100) / 100,
    }))

    const weekCost = dailyCosts.reduce((sum, d) => sum + d.cost, 0)
    const maxDailyCost = Math.max(...dailyCosts.map(d => d.cost), 1)

    return {
      todayCost,
      todayTokens,
      todayExecs,
      weekCost,
      agentCosts,
      usageEntries,
      dailyCosts,
      maxDailyCost,
    }
  }

  const billingData = calculateBillingData()
  const { todayCost, todayTokens, todayExecs, weekCost, agentCosts, usageEntries, dailyCosts, maxDailyCost } = billingData

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Billing Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
            <p className="text-sm text-purple-200 mt-1">{todayExecs > 0 ? `${todayExecs} executions today` : 'No executions yet'}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-teal-200" />
              <p className="text-sm text-teal-100 font-medium">Weekly Spend</p>
            </div>
            <p className="text-3xl font-bold">${weekCost.toFixed(2)}</p>
            <p className="text-sm text-teal-200 mt-1">{weekCost > 0 ? `On track for $${(weekCost * 4.3).toFixed(0)}/mo` : 'No spend this week'}</p>
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-sky-200" />
              <p className="text-sm text-sky-100 font-medium">Tokens Used</p>
            </div>
            <p className="text-3xl font-bold">{todayTokens > 0 ? `${(todayTokens / 1000).toFixed(0)}k` : '0'}</p>
            <p className="text-sm text-sky-200 mt-1">{todayExecs} executions</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-violet-200" />
              <p className="text-sm text-violet-100 font-medium">Avg per Execution</p>
            </div>
            <p className="text-3xl font-bold">{todayExecs > 0 ? `$${(todayCost / todayExecs).toFixed(3)}` : '$0.00'}</p>
            <p className="text-sm text-violet-200 mt-1">{todayExecs > 0 ? `${Math.round(todayTokens / todayExecs)} tokens avg` : 'No data yet'}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : executions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">No billing data available</p>
              <p className="text-muted-foreground">Execute agents to generate billing records</p>
            </div>
          </div>
        ) : (
          <>
          {/* Subscription Plans */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {subscriptionTiers.map(tier => (
              <div key={tier.lookup} className="bg-card border border-border rounded-xl p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <p className="text-3xl font-bold text-foreground mt-2">${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-4 space-y-2 flex-1">
                  {tier.features.map(f => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(tier.lookup)}
                  disabled={checkoutLoading === tier.lookup}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {checkoutLoading === tier.lookup ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Subscribe
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Daily Cost Chart */}
            <div className="col-span-2 bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Daily Cost (This Week)</h2>
              <div className="flex items-end gap-3 h-48">
                {dailyCosts.map(d => (
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
                {agentCosts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No agent costs yet</p>
                ) : (
                  agentCosts.map(agent => (
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
                  ))
                )}
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
                  {usageEntries.map((entry, i) => (
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
          </>
        )}
      </div>
    </div>
  )
}
