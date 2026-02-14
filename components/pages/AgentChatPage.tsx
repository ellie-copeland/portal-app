'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Paperclip, Phone, Sparkles, AlertCircle, Loader2, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { authHeaders } from '@/lib/fetch-auth'

interface Agent {
  id: string
  name: string
  model?: string
  status?: 'active' | 'inactive'
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agent?: string
}

interface AgentChatPageProps {
  onNavigateToSettings?: (page: any) => void
}

export default function AgentChatPage({ onNavigateToSettings }: AgentChatPageProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [apiKeyError, setApiKeyError] = useState(false)
  const [checkingKeys, setCheckingKeys] = useState(true)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get<{ agents: Agent[] }>('/api/agents')
        const agentsList = response.agents || []
        setAgents(agentsList)
        
        if (agentsList.length > 0) {
          // Restore last selected agent or default to first
          const lastAgentId = typeof window !== 'undefined' ? localStorage.getItem('lastChatAgentId') : null
          const restoredAgent = lastAgentId ? agentsList.find(a => a.id === lastAgentId) : null
          const agent = restoredAgent || agentsList[0]
          handleSelectAgent(agent.name, agent.id)
        }
      } catch (err) {
        console.error('Error fetching agents:', err)
        setAgents([])
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
    checkApiKeys()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check for API keys on mount
  const checkApiKeys = async () => {
    try {
      const res = await fetch('/api/keys', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setApiKeyError(!data.keys || data.keys.length === 0)
      } else {
        setApiKeyError(true)
      }
    } catch (error) {
      console.error('Error checking API keys:', error)
      setApiKeyError(true)
    } finally {
      setCheckingKeys(false)
    }
  }

  // Update selected agent and load conversation history
  const handleSelectAgent = async (agentName: string, agentId: string) => {
    setSelectedAgent(agentName)
    setSelectedAgentId(agentId)
    setMessages([])
    setConversationId(null)
    if (typeof window !== 'undefined') localStorage.setItem('lastChatAgentId', agentId)

    // Try to load most recent conversation for this agent
    try {
      const res = await fetch(`/api/conversations?agentId=${agentId}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        const convs = data.conversations || []
        if (convs.length > 0) {
          const latest = convs[0]
          setConversationId(latest.id)
          // Load messages for this conversation
          const msgRes = await fetch(`/api/conversations/${latest.id}/messages`, { headers: authHeaders() })
          if (msgRes.ok) {
            const msgData = await msgRes.json()
            const history = (msgData.messages || []).map((m: any) => ({
              id: m.id,
              role: (m.role?.toLowerCase() || 'user') as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              agent: m.role === 'assistant' ? agentName : undefined,
            }))
            setMessages(history)
          }
        }
      }
    } catch {
      // No history available, start fresh
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    if (apiKeyError) return
    if (!selectedAgentId) return

    try {
      setSendingMessage(true)

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, userMsg])

      const messageInput = input
      setInput('')

      // Send message to API (streaming response)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          content: messageInput,
          agentId: selectedAgentId,
          conversationId: conversationId,
        }),
      })

      // Update conversation ID from header
      const newConvId = res.headers.get('X-Conversation-Id')
      if (newConvId && !conversationId) {
        setConversationId(newConvId)
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      // Read streaming response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      const agentMsgId = Date.now().toString() + '-assistant'

      // Add placeholder assistant message
      const agentMsg: ChatMessage = {
        id: agentMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        agent: selectedAgent || undefined,
      }
      setMessages(prev => [...prev, agentMsg])

      if (reader) {
        let fullText = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setMessages(prev => prev.map(m =>
            m.id === agentMsgId ? { ...m, content: fullText } : m
          ))
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      // Show error message to user
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Error sending message: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        agent: selectedAgent || undefined,
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* Agent list sidebar */}
      <div className="w-72 border-r border-border bg-card flex-shrink-0 flex flex-col hidden sm:flex">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Agent Chat</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Talk to your AI employees</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground">No agents available</p>
            </div>
          ) : (
            agents.map(agent => {
              const name = agent.name
              const isActive = selectedAgent === name
              return (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(name, agent.id)}
                  className={`w-full px-4 py-3.5 text-left border-b border-border/50 transition-all ${
                    isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-muted'
                    }`}>
                      <Bot className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground'}`}>{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.model || 'No model'}</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Channel badges */}
        <div className="p-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Also available via</p>
          <div className="flex gap-2">
            <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg font-medium">WhatsApp</span>
            <span className="text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-lg font-medium">Telegram</span>
            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg font-medium">Slack</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{selectedAgent || 'Select an agent'}</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Online · Supervised mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedAgentId && selectedAgent) {
                  setConversationId(null)
                  setMessages([])
                }
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Voice call">
              <Phone className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {!loading && !checkingKeys && apiKeyError && (
            <div className="self-center max-w-sm text-center">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">No API Key Configured</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  Add an API key to start chatting with your agents
                </p>
                <button
                  onClick={() => onNavigateToSettings?.('settings')}
                  className="text-sm px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                >
                  Go to Settings
                </button>
              </div>
            </div>
          )}
          {!loading && messages.length === 0 && selectedAgent && !apiKeyError && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">Chat with {selectedAgent}</p>
              <p className="text-muted-foreground">Start a conversation to see messages here</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-purple-100 dark:bg-purple-900/40'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-teal-600" />
                  : <Bot className="w-4 h-4 text-purple-600" />
                }
              </div>
              <div className={`max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-md'
                    : 'bg-card border border-border rounded-tl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">{msg.timestamp}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={selectedAgent ? `Message ${selectedAgent}...` : 'Select an agent first...'}
              disabled={!selectedAgent || apiKeyError || sendingMessage}
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || apiKeyError || !selectedAgent || sendingMessage}
              title={apiKeyError ? 'No API key configured. Add one in Settings' : !selectedAgent ? 'Select an agent first' : ''}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
