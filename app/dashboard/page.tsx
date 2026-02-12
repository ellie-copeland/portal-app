'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, getCurrentUser } from '@/lib/db/supabase'
import AgentBuilder from '@/components/AgentBuilder'
import ChatThread from '@/components/ChatThread'
import KanbanBoard from '@/components/KanbanBoard'
import LLMConfig from '@/components/LLMConfig'
import UsageDashboard from '@/components/UsageDashboard'
import WorkspaceSelector from '@/components/WorkspaceSelector'

type TabType = 'overview' | 'agents' | 'chat' | 'kanban' | 'config' | 'usage'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
      } else {
        setUser(currentUser)
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cloud Employee Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'agents', label: 'Agent Builder' },
              { key: 'chat', label: 'Chat' },
              { key: 'kanban', label: 'Kanban' },
              { key: 'config', label: 'LLM Config' },
              { key: 'usage', label: 'Usage' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <WorkspaceSelector />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Agents</h3>
                <p className="text-3xl font-bold text-blue-600">5</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasks</h3>
                <p className="text-3xl font-bold text-green-600">12</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                <p className="text-3xl font-bold text-purple-600">48</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && <AgentBuilder />}
        {activeTab === 'chat' && <ChatThread />}
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'config' && <LLMConfig />}
        {activeTab === 'usage' && <UsageDashboard />}
      </div>
    </div>
  )
}
