'use client'

import { useState, useEffect } from 'react'
import AuthPage from '@/components/AuthPage'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import LLMKeyBanner from '@/components/LLMKeyBanner'
import AgentsPage from '@/components/pages/AgentsPage'
import TasksPage from '@/components/pages/TasksPage'
import ChatPage from '@/components/pages/ChatPage'
import CommandCenterPage from '@/components/pages/CommandCenterPage'
import ExecutionsPage from '@/components/pages/ExecutionsPage'
import IntegrationsPage from '@/components/pages/IntegrationsPage'
import BillingPage from '@/components/pages/BillingPage'
import TemplatesPage from '@/components/pages/TemplatesPage'
import MonitoringPage from '@/components/pages/MonitoringPage'
import SupervisedPage from '@/components/pages/SupervisedPage'
import AgentChatPage from '@/components/pages/AgentChatPage'
import SetupWizardPage from '@/components/pages/SetupWizardPage'
import SecurityPage from '@/components/pages/SecurityPage'
import SettingsPage from '@/components/pages/SettingsPage'
import TeamPage from '@/components/pages/TeamPage'
import LandingPage from '@/components/pages/LandingPage'

export type PageType = 'agents' | 'tasks' | 'chat' | 'command-center' | 'executions' | 'integrations' | 'billing' | 'templates' | 'monitoring' | 'supervised' | 'agent-chat' | 'setup' | 'security' | 'settings' | 'team'

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>('command-center')
  const [darkMode, setDarkMode] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setAuthed(false)
      return
    }
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Unauthorized')
      })
      .then(data => {
        setUser(data.user || data)
        setAuthed(true)
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
        setAuthed(false)
      })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleAuth = (token: string, userData: any) => {
    setUser(userData)
    setAuthed(true)
    setShowAuth(false)
  }

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    setAuthed(false)
    setUser(null)
    setShowAuth(false)
  }

  // Loading state
  if (authed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not authenticated — show landing page or auth
  if (!authed) {
    if (showAuth) {
      return <AuthPage onAuth={handleAuth} />
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'command-center': return <CommandCenterPage />
      case 'agents': return <AgentsPage />
      case 'templates': return <TemplatesPage />
      case 'monitoring': return <MonitoringPage />
      case 'supervised': return <SupervisedPage />
      case 'agent-chat': return <AgentChatPage onNavigateToSettings={setCurrentPage} />
      case 'tasks': return <TasksPage />
      case 'chat': return <ChatPage />
      case 'executions': return <ExecutionsPage />
      case 'integrations': return <IntegrationsPage />
      case 'billing': return <BillingPage />
      case 'setup': return <SetupWizardPage />
      case 'security': return <SecurityPage />
      case 'settings': return <SettingsPage />
      case 'team': return <TeamPage />
      default: return <CommandCenterPage />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="pt-14 md:pt-0">
          <Header onNavigate={setCurrentPage} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} onSignOut={handleSignOut} user={user} />
        </div>
        <main className="flex-1 overflow-auto">
          <LLMKeyBanner onAddKey={() => setCurrentPage('settings')} />
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
