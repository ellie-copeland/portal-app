'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Paperclip, Phone, Sparkles } from 'lucide-react'
import { getAgents } from '@/lib/store'

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  agent?: string
}

const MOCK_CONVERSATIONS: Record<string, ChatMessage[]> = {
  'Customer Support': [
    { id: 'm1', role: 'agent', content: "Good morning! I've been monitoring your support channels. 3 new tickets came in overnight — 2 billing issues and 1 feature request. The billing issues are related to the PaymentProcessor error from yesterday. Want me to draft responses?", timestamp: '9:01 AM', agent: 'Customer Support' },
    { id: 'm2', role: 'user', content: 'Yes, draft responses for the billing issues. What about the feature request?', timestamp: '9:03 AM' },
    { id: 'm3', role: 'agent', content: "The feature request is for bulk export of invoices — it's been requested 4 times this month. I'd recommend adding it to the product roadmap. I'll draft the billing responses now and send them for your approval in the Supervised queue.", timestamp: '9:03 AM', agent: 'Customer Support' },
  ],
  'Sentry Monitor': [
    { id: 'm4', role: 'agent', content: '🚨 Alert: PaymentProcessor NullPointerException — error rate up 340% since deploy #892 (15 min ago). 23 users affected. I\'ve correlated this with 3 customer complaints in #support.', timestamp: '2:15 PM', agent: 'Sentry Monitor' },
    { id: 'm5', role: 'user', content: 'Should we rollback?', timestamp: '2:16 PM' },
    { id: 'm6', role: 'agent', content: 'Recommended. Deploy #892 introduced a null check removal in PaymentProcessor.java:142. The rollback would revert just that change. I can create a Linear ticket for the proper fix and notify Marcus (the deployer). Want me to proceed?', timestamp: '2:16 PM', agent: 'Sentry Monitor' },
  ],
  'Sales Assistant': [
    { id: 'm7', role: 'agent', content: 'Morning update: 3 deals need attention today.\n\n1. **Acme Corp** ($45k) — stale 8 days, follow-up drafted\n2. **TechStart** ($12k) — demo scheduled Thursday\n3. **DataFlow** ($28k) — contract review pending\n\nShould I send the Acme follow-up?', timestamp: '9:15 AM', agent: 'Sales Assistant' },
    { id: 'm8', role: 'user', content: 'Hold on Acme, let me review the email first. Prep the TechStart demo deck.', timestamp: '9:18 AM' },
    { id: 'm9', role: 'agent', content: "Got it. Acme email is in your Supervised queue for review. I'll pull together the TechStart demo deck — they're most interested in our API integration and analytics features based on the discovery call notes. I'll have it ready in 10 minutes.", timestamp: '9:18 AM', agent: 'Sales Assistant' },
  ],
}

export default function AgentChatPage() {
  const [agents] = useState(getAgents())
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.name || 'Customer Support')
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CONVERSATIONS[selectedAgent] || [])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(MOCK_CONVERSATIONS[selectedAgent] || [])
  }, [selectedAgent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // Simulate agent response
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: "I understand. Let me look into that and get back to you with details. I'll check the relevant tools and context.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        agent: selectedAgent,
      }
      setMessages(prev => [...prev, agentMsg])
    }, 1500)
  }

  const agentNames = Object.keys(MOCK_CONVERSATIONS)
  const allAgents = [...new Set([...agentNames, ...agents.map(a => a.name)])]

  return (
    <div className="flex h-full">
      {/* Agent list sidebar */}
      <div className="w-72 border-r border-border bg-card flex-shrink-0 flex flex-col hidden sm:flex">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Agent Chat</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Talk to your AI employees</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allAgents.map(name => {
            const lastMsg = MOCK_CONVERSATIONS[name]?.slice(-1)[0]
            const isActive = selectedAgent === name
            return (
              <button
                key={name}
                onClick={() => setSelectedAgent(name)}
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
                    <p className="text-xs text-muted-foreground truncate">{lastMsg?.content.slice(0, 50) || 'No messages yet'}...</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Channel badges */}
        <div className="p-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Also available via</p>
          <div className="flex gap-2">
            <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg font-medium">WhatsApp</span>
            <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-lg font-medium">Telegram</span>
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
              <h3 className="font-semibold text-foreground">{selectedAgent}</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Online · Supervised mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Voice call">
              <Phone className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              placeholder={`Message ${selectedAgent}...`}
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
