'use client'

import { useState } from 'react'
import { Check, Clock, Download, Lock, Server, Shield, ShieldCheck, X } from 'lucide-react'

interface ComplianceBadge {
  name: string
  status: 'compliant' | 'in-progress' | 'not-started'
  description: string
}

interface SecurityMetric {
  label: string
  value: string
  status: 'good' | 'warning' | 'critical'
}

const COMPLIANCE: ComplianceBadge[] = [
  { name: 'SOC 2 Type II', status: 'compliant', description: 'Annual audit passed. Next review: March 2027.' },
  { name: 'GDPR', status: 'compliant', description: 'EU data handling compliant. DPA available on request.' },
  { name: 'CCPA', status: 'compliant', description: 'California consumer privacy rights supported.' },
  { name: 'HIPAA', status: 'in-progress', description: 'BAA template available. Full compliance Q3 2026.' },
  { name: 'ISO 27001', status: 'in-progress', description: 'Certification in progress. Target: Q4 2026.' },
  { name: 'PCI DSS', status: 'not-started', description: 'Not applicable unless processing payments directly.' },
]

const METRICS: SecurityMetric[] = [
  { label: 'Data Encryption', value: 'AES-256 at rest, TLS 1.3 in transit', status: 'good' },
  { label: 'Uptime SLA', value: '99.95% (last 30 days: 99.98%)', status: 'good' },
  { label: 'VM Isolation', value: 'Dedicated per customer', status: 'good' },
  { label: 'Audit Log Retention', value: '90 days (configurable to 365)', status: 'good' },
  { label: 'SSO/SAML', value: 'Available (Enterprise plan)', status: 'good' },
  { label: 'API Key Rotation', value: 'Last rotated 12 days ago', status: 'warning' },
  { label: '2FA Enforcement', value: 'Enabled for all team members', status: 'good' },
  { label: 'Vulnerability Scan', value: 'Last scan: 2 days ago — 0 critical', status: 'good' },
]

const AUDIT_LOG = [
  { timestamp: '2:15 PM', user: 'Sentry Monitor (AI)', action: 'Created Linear ticket #1248', target: 'Linear', risk: 'low' },
  { timestamp: '1:45 PM', user: 'Brady Miller', action: 'Approved draft response to customer', target: 'Slack #support', risk: 'low' },
  { timestamp: '12:30 PM', user: 'Sales Assistant (AI)', action: 'Updated deal stage: Acme Corp → Proposal', target: 'HubSpot', risk: 'low' },
  { timestamp: '11:00 AM', user: 'System', action: 'API key rotation reminder sent', target: 'Admin', risk: 'medium' },
  { timestamp: '10:23 AM', user: 'Anish Kumar', action: 'Attempted audit log modification — DENIED', target: 'Audit System', risk: 'high' },
  { timestamp: '10:25 AM', user: 'Anish Kumar', action: 'Repeated audit log modification request — DENIED', target: 'Audit System', risk: 'high' },
  { timestamp: '9:00 AM', user: 'Morning Briefing (AI)', action: 'Posted daily summary to #general', target: 'Slack', risk: 'low' },
  { timestamp: '8:30 AM', user: 'System', action: 'Daily security scan completed — 0 issues', target: 'Security', risk: 'low' },
]

const statusConfig = {
  compliant: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Compliant' },
  'in-progress': { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'In Progress' },
  'not-started': { icon: X, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Not Started' },
}

const riskColors: Record<string, string> = {
  low: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  high: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'compliance'>('overview')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Security & Compliance</h1>
            <p className="text-muted-foreground">Encryption status, compliance badges, audit trail, and infrastructure security</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-all">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-emerald-600 font-medium">Security Score</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-1">94/100</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-purple-600 font-medium">Encryption</p>
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">AES-256</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-500" />
              <p className="text-xs text-teal-600 font-medium">Uptime</p>
            </div>
            <p className="text-2xl font-bold text-teal-700 mt-1">99.98%</p>
          </div>
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <p className="text-xs text-sky-600 font-medium">Compliance</p>
            </div>
            <p className="text-2xl font-bold text-sky-700 mt-1">3/6</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          {(['overview', 'audit', 'compliance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab === 'audit' ? 'Audit Trail' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Infrastructure Security</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {METRICS.map(metric => (
                  <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        metric.status === 'good' ? 'bg-emerald-500' : metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium text-foreground">{metric.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VM Isolation */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Tenant Isolation</h2>
              <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-semibold text-foreground">Dedicated VM per Customer</p>
                    <p className="text-sm text-muted-foreground">Your data and AI agents run in an isolated virtual machine</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Network</p>
                    <p className="text-sm font-semibold text-emerald-600">Isolated</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="text-sm font-semibold text-emerald-600">Encrypted</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Memory</p>
                    <p className="text-sm font-semibold text-emerald-600">Isolated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Today's Activity</h2>
              <span className="text-xs text-muted-foreground">{AUDIT_LOG.length} events</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">User/Agent</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Target</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((entry, i) => (
                  <tr key={i} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${
                    entry.risk === 'high' ? 'bg-red-50/30' : ''
                  }`}>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{entry.timestamp}</td>
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{entry.user}</td>
                    <td className="px-5 py-3 text-sm text-foreground">{entry.action}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{entry.target}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskColors[entry.risk]}`}>
                        {entry.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPLIANCE.map(badge => {
              const config = statusConfig[badge.status]
              const Icon = config.icon
              return (
                <div key={badge.name} className={`bg-card border ${config.border} rounded-xl p-6 hover:shadow-md transition-all`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{badge.name}</h3>
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
