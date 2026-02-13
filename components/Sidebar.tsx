'use client'

import { useState } from 'react'
import { PageType } from '@/app/page'
import { LayoutDashboard, Zap, MessageSquare, Users, Activity, Link2, CreditCard, BookTemplate, Menu, X, Eye, AlertTriangle, MessageCircle, Rocket, Shield, Settings, UserPlus } from 'lucide-react'

interface SidebarProps {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
}

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sections = [
    {
      label: 'Overview',
      items: [
        { id: 'command-center' as PageType, label: 'Command Center', icon: Activity },
        { id: 'monitoring' as PageType, label: 'Monitoring', icon: AlertTriangle },
      ]
    },
    {
      label: 'Agents',
      items: [
        { id: 'agents' as PageType, label: 'My Agents', icon: Users },
        { id: 'templates' as PageType, label: 'Templates', icon: BookTemplate },
        { id: 'supervised' as PageType, label: 'Supervised AI', icon: Eye },
        { id: 'agent-chat' as PageType, label: 'Agent Chat', icon: MessageCircle },
      ]
    },
    {
      label: 'Operations',
      items: [
        { id: 'tasks' as PageType, label: 'Tasks', icon: LayoutDashboard },
        { id: 'executions' as PageType, label: 'Executions', icon: Zap },
        { id: 'integrations' as PageType, label: 'Integrations', icon: Link2 },
      ]
    },
    {
      label: 'Account',
      items: [
        { id: 'billing' as PageType, label: 'Billing', icon: CreditCard },
        { id: 'team' as PageType, label: 'Team', icon: UserPlus },
        { id: 'settings' as PageType, label: 'Settings', icon: Settings },
        { id: 'security' as PageType, label: 'Security', icon: Shield },
        { id: 'setup' as PageType, label: 'Quick Setup', icon: Rocket },
      ]
    },
  ]

  const handleNav = (page: PageType) => {
    setCurrentPage(page)
    setMobileOpen(false)
  }

  const navContent = (
    <>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-400 rounded-xl flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Portal</h1>
            <p className="text-xs text-muted-foreground">AI Employee Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full px-3 py-2 rounded-xl transition-all text-left flex items-center gap-3 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p className="font-medium mb-0.5">Cloud Employee Portal</p>
          <p>Powered by Assistable.ai</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-xl shadow-lg md:hidden"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-2xl flex flex-col transform transition-transform duration-200 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border bg-card shadow-sm h-screen flex-col flex-shrink-0">
        {navContent}
      </aside>
    </>
  )
}
