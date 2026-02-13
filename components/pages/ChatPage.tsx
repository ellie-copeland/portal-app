'use client'

import { useState } from 'react'
import { Plus, Search, MoreVertical } from 'lucide-react'
import ChatThread from '@/components/ChatThread'

interface Thread {
  id: string
  title: string
  participants: string[]
  messages: Message[]
  lastMessageTime: string
  unread: number
}

interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  mentions: string[]
}

const MOCK_THREADS: Thread[] = [
  {
    id: '1',
    title: 'Agent Configuration Discussion',
    participants: ['You', 'Main Customer Support', 'FAQ Bot'],
    messages: [
      { id: '1', author: 'You', content: 'How should we configure the main agent?', timestamp: '2024-02-11 10:30', mentions: ['Main Customer Support'] },
      { id: '2', author: 'Main Customer Support', content: 'I suggest we focus on customer support first.', timestamp: '2024-02-11 10:31', mentions: ['You'] },
      { id: '3', author: 'FAQ Bot', content: '@You Consider adding FAQ integration', timestamp: '2024-02-11 10:32', mentions: ['You'] },
    ],
    lastMessageTime: '2024-02-11 10:32',
    unread: 0,
  },
  {
    id: '2',
    title: 'Task Scheduling',
    participants: ['You', 'Sales Assistant'],
    messages: [
      { id: '1', author: 'You', content: 'Can we schedule daily updates?', timestamp: '2024-02-11 09:00', mentions: ['Sales Assistant'] },
      { id: '2', author: 'Sales Assistant', content: 'Yes, I can handle that.', timestamp: '2024-02-11 09:05', mentions: ['You'] },
    ],
    lastMessageTime: '2024-02-11 09:05',
    unread: 1,
  },
  {
    id: '3',
    title: 'Performance Review',
    participants: ['You', 'Main Customer Support', 'FAQ Bot', 'Sales Assistant'],
    messages: [
      { id: '1', author: 'Main Customer Support', content: 'Performance metrics are looking good', timestamp: '2024-02-11 08:00', mentions: [] },
      { id: '2', author: 'You', content: 'Great! Let\'s continue optimizing.', timestamp: '2024-02-11 08:15', mentions: ['Main Customer Support', 'FAQ Bot', 'Sales Assistant'] },
    ],
    lastMessageTime: '2024-02-11 08:15',
    unread: 3,
  },
]

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threads[0]?.id)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectedThread = threads.find(t => t.id === selectedThreadId)

  const handleSendMessage = (content: string, mentions: string[]) => {
    if (!selectedThreadId) return

    const newMessage: Message = {
      id: Date.now().toString(),
      author: 'You',
      content,
      timestamp: new Date().toLocaleString(),
      mentions,
    }

    setThreads(threads.map(t =>
      t.id === selectedThreadId
        ? { ...t, messages: [...t.messages, newMessage], lastMessageTime: newMessage.timestamp }
        : t
    ))
  }

  const handleNewThread = () => {
    const newThread: Thread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      participants: ['You'],
      messages: [],
      lastMessageTime: new Date().toLocaleString(),
      unread: 0,
    }
    setThreads([newThread, ...threads])
    setSelectedThreadId(newThread.id)
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
          {filteredThreads.map(thread => (
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
                    thread.unread > 0 ? 'font-bold' : ''
                  }`}>
                    {thread.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {thread.participants.slice(0, 2).join(', ')}
                    {thread.participants.length > 2 ? ` +${thread.participants.length - 2}` : ''}
                  </p>
                </div>
                {thread.unread > 0 && (
                  <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {thread.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {selectedThread ? (
          <ChatThread
            thread={selectedThread}
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
