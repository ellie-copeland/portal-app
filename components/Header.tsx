'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Search, X, Settings, User, Moon, Sun, ChevronRight, Check } from 'lucide-react'
import { PageType } from '@/app/page'

interface Notification {
  id: string
  type: 'alert' | 'approval' | 'system'
  title: string
  description: string
  timestamp: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'alert', title: 'Critical: PaymentProcessor error spike', description: 'Sentry Monitor detected 340% increase in errors', timestamp: '2 min ago', read: false },
  { id: 'n2', type: 'approval', title: 'Pending: Draft response for Acme Corp', description: 'Sales Assistant needs your approval', timestamp: '5 min ago', read: false },
  { id: 'n3', type: 'system', title: 'Setup complete', description: 'Your Engineering Team template has been deployed', timestamp: '15 min ago', read: false },
  { id: 'n4', type: 'alert', title: 'Warning: HubSpot API quota at 87%', description: 'Consider throttling CRM sync frequency', timestamp: '20 min ago', read: true },
  { id: 'n5', type: 'approval', title: 'Approved: PR #249 review comment', description: 'Code Reviewer action was approved by Brady M.', timestamp: '1 hour ago', read: true },
  { id: 'n6', type: 'system', title: 'New template available', description: 'On-Call Companion template added to marketplace', timestamp: '2 hours ago', read: true },
]

const SEARCH_PAGES: { id: PageType; label: string; section: string }[] = [
  { id: 'command-center', label: 'Command Center', section: 'Overview' },
  { id: 'monitoring', label: 'Monitoring', section: 'Overview' },
  { id: 'agents', label: 'My Agents', section: 'Agents' },
  { id: 'templates', label: 'Templates', section: 'Agents' },
  { id: 'supervised', label: 'Supervised AI', section: 'Agents' },
  { id: 'agent-chat', label: 'Agent Chat', section: 'Agents' },
  { id: 'tasks', label: 'Tasks', section: 'Operations' },
  { id: 'executions', label: 'Executions', section: 'Operations' },
  { id: 'integrations', label: 'Integrations', section: 'Operations' },
  { id: 'billing', label: 'Billing', section: 'Account' },
  { id: 'security', label: 'Security & Compliance', section: 'Account' },
  { id: 'settings', label: 'Settings', section: 'Account' },
  { id: 'team', label: 'Team Management', section: 'Account' },
  { id: 'setup', label: 'Quick Setup', section: 'Account' },
]

interface HeaderProps {
  onNavigate: (page: PageType) => void
  darkMode: boolean
  onToggleDark: () => void
}

export default function Header({ onNavigate, darkMode, onToggleDark }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowNotifications(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredPages = searchQuery
    ? SEARCH_PAGES.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase()) || p.section.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_PAGES

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const typeColors = {
    alert: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    approval: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    system: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }

  return (
    <>
      <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between gap-3 flex-shrink-0">
        {/* Search trigger */}
        <button
          onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 100) }}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all max-w-xs flex-1 sm:flex-initial"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline text-xs bg-background px-1.5 py-0.5 rounded border border-border ml-auto">⌘K</kbd>
        </button>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button onClick={onToggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowSearch(false) }}
              className="p-2 rounded-lg hover:bg-muted transition-colors relative"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${typeColors[n.type]}`}>
                          {n.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'text-foreground'}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{n.timestamp}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <button
            onClick={() => onNavigate('settings' as PageType)}
            className="w-8 h-8 bg-gradient-to-br from-purple-500 to-teal-400 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          >
            U
          </button>
        </div>
      </header>

      {/* Search Modal */}
      {showSearch && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowSearch(false)} />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search pages, agents, actions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {filteredPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => { onNavigate(page.id); setShowSearch(false); setSearchQuery('') }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{page.label}</p>
                    <p className="text-xs text-muted-foreground">{page.section}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
