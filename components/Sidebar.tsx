'use client'

import { useState, useEffect } from 'react'
import { PageType } from '@/app/page'
import { LayoutDashboard, Zap, MessageSquare, Users, Activity, Link2, CreditCard, BookTemplate, Menu, X, Eye, AlertTriangle, MessageCircle, Rocket, Shield, Settings, UserPlus, ChevronDown, Plus } from 'lucide-react'

interface Team {
  id: string
  name: string
}

interface SidebarProps {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
}

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }

  // Load teams on mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/teams', { headers: getHeaders() })
        if (response.ok) {
          const data = await response.json()
          setTeams(data)

          // Load active team from localStorage
          const savedTeamId = localStorage.getItem('activeTeamId')
          const activeTeam = savedTeamId
            ? data.find((t: Team) => t.id === savedTeamId) || data[0]
            : data[0]
          
          if (activeTeam) {
            setCurrentTeam(activeTeam)
          }
        }
      } catch (error) {
        console.error('Failed to load teams:', error)
      } finally {
        setLoadingTeams(false)
      }
    }

    loadTeams()
  }, [])

  // Save active team to localStorage when changed
  const handleTeamChange = (team: Team) => {
    setCurrentTeam(team)
    localStorage.setItem('activeTeamId', team.id)
    setShowTeamDropdown(false)
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setCreating(true)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newTeamName.trim() }),
      })

      if (response.ok) {
        const newTeam = await response.json()
        const newTeamData = { id: newTeam.id, name: newTeam.name }
        setTeams([...teams, newTeamData])
        setCurrentTeam(newTeamData)
        localStorage.setItem('activeTeamId', newTeamData.id)
        setShowTeamDropdown(false)
        setShowCreateModal(false)
        setNewTeamName('')
      }
    } catch (error) {
      console.error('Failed to create team:', error)
    } finally {
      setCreating(false)
    }
  }

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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-400 rounded-xl flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Portal</h1>
            <p className="text-xs text-muted-foreground">AI Employee Platform</p>
          </div>
        </div>

        {/* Team Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
            className="w-full px-3 py-2.5 bg-muted/50 hover:bg-muted border border-border rounded-lg flex items-center justify-between gap-2 transition-colors"
          >
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Team</p>
              <p className="text-sm font-medium text-foreground truncate">
                {loadingTeams ? 'Loading...' : currentTeam?.name || 'Select team'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Team Dropdown */}
          {showTeamDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamChange(team)}
                    className={`w-full px-3 py-2.5 text-left text-sm transition-colors border-b border-border/50 last:border-b-0 ${
                      currentTeam?.id === team.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>

              {/* Create Team Button */}
              <button
                onClick={() => { setShowCreateModal(true); setShowTeamDropdown(false) }}
                className="w-full px-3 py-2.5 text-left text-sm text-primary hover:bg-primary/5 border-t border-border flex items-center gap-2 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
            </div>
          )}
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

      {/* Create Team Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowCreateModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Create New Team</h2>
            <p className="text-sm text-muted-foreground mb-4">Teams let you organize agents and collaborate with others.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam() }}>
              <label className="text-sm font-medium text-foreground block mb-1.5">Team Name</label>
              <input
                type="text"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. Marketing, Engineering, Sales"
                autoFocus
                required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewTeamName('') }}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTeamName.trim()}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
