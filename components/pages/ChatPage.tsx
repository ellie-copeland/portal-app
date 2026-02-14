'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, MoreVertical, Loader2 } from 'lucide-react'
import ChatThread from '@/components/ChatThread'
import { apiClient } from '@/lib/api-client'

interface APIMessage {
  id: string
  role?: string
  author?: string
  content: string
  timestamp?: string
  createdAt?: string
  mentions?: string[]
}

interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  mentions: string[]
}

interface Thread {
  id: string
  title: string
  participants?: string[]
  messages?: Message[]
  lastMessageTime?: string
  unread?: number
  agent?: { name: string }
  _count?: { messages: number }
}

interface APIConversation {
  id: string
  title: string
  agent?: { name: string }
  messages?: Message[]
  _count?: { messages: number }
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [selectedThreadMessages, setSelectedThreadMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<{ conversations: APIConversation[] }>('/api/conversations')
        const conversations = response.conversations || []
        
        const mappedThreads: Thread[] = conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          participants: conv.agent?.name ? ['You', conv.agent.name] : ['You'],
          messages: conv.messages || [],
          lastMessageTime: new Date().toLocaleString(),
          unread: 0,
          agent: conv.agent,
          _count: conv._count,
        }))

        setThreads(mappedThreads)
        if (mappedThreads.length > 0) {
          setSelectedThreadId(mappedThreads[0].id)
        }
      } catch (err) {
        console.error('Error fetching conversations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
        setThreads([])
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Fetch messages for selected thread
  useEffect(() => {
    if (!selectedThreadId) return

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true)
        const response = await apiClient.get<{ messages: APIMessage[] }>(`/api/conversations/${selectedThreadId}/messages?limit=50`)
        const apiMessages = response.messages || []
        
        // Transform API messages to ChatThread format
        const transformedMessages: Message[] = apiMessages.map(msg => ({
          id: msg.id,
          author: msg.author || (msg.role === 'USER' ? 'You' : msg.role === 'ASSISTANT' ? 'Assistant' : 'Unknown'),
          content: msg.content,
          timestamp: msg.timestamp || msg.createdAt || new Date().toLocaleString(),
          mentions: msg.mentions || [],
        }))
        
        setSelectedThreadMessages(transformedMessages)
      } catch (err) {
        console.error('Error fetching messages:', err)
        setSelectedThreadMessages([])
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [selectedThreadId])

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.participants && thread.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const selectedThread = threads.find(t => t.id === selectedThreadId)

  const handleSendMessage = async (content: string, mentions: string[]) => {
    if (!selectedThreadId) return

    try {
      // Send message via API
      const response = await apiClient.post(`/api/conversations/${selectedThreadId}/messages`, {
        content,
      })

      // Add new message to local state
      const newMessage: Message = {
        id: Date.now().toString(),
        author: 'You',
        content,
        timestamp: new Date().toLocaleString(),
        mentions,
      }

      setSelectedThreadMessages([...selectedThreadMessages, newMessage])
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const handleNewThread = () => {
    // In a real implementation, this would create a new conversation via API
    alert('Create new conversation feature coming soon')
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Conversations</h2>
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
    <div className="flex h-full bg-background">
      {/* Thread List */}
      <div className="w-80 border-r border-border bg-card flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Chat</h2>
            <button
              onClick={handleNewThread}
              className="p-2 hover:bg-accent rounded-lg transition-all"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent transition-all ${
                  selectedThreadId === thread.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm text-foreground truncate ${
                      thread.unread && thread.unread > 0 ? 'font-bold' : ''
                    }`}>
                      {thread.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {thread.participants && thread.participants.slice(0, 2).join(', ')}
                      {thread.participants && thread.participants.length > 2 ? ` +${thread.participants.length - 2}` : ''}
                    </p>
                  </div>
                  {thread.unread && thread.unread > 0 && (
                    <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {thread.unread}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : selectedThread ? (
          <ChatThread
            thread={{
              id: selectedThread.id,
              title: selectedThread.title,
              participants: selectedThread.participants || ['You'],
              messages: selectedThreadMessages,
              lastMessageTime: selectedThread.lastMessageTime || new Date().toLocaleString(),
              unread: selectedThread.unread || 0,
            }}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">No thread selected</p>
              <p className="text-muted-foreground">Select a thread to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
