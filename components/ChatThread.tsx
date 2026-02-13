'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, AtSign } from 'lucide-react'

interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  mentions: string[]
}

interface ChatThreadProps {
  thread: {
    id: string
    title: string
    participants: string[]
    messages: Message[]
    lastMessageTime: string
    unread: number
  }
  onSendMessage: (content: string, mentions: string[]) => void
}

export default function ChatThread({ thread, onSendMessage }: ChatThreadProps) {
  const [message, setMessage] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [thread.messages])

  const availableMentions = thread.participants.filter(p =>
    !mentions.includes(p) && p.toLowerCase().includes(mentionFilter.toLowerCase())
  )

  const handleMentionSelect = (mention: string) => {
    setMentions([...mentions, mention])
    setMessage(message.replace('@' + mentionFilter, ''))
    setMentionFilter('')
    setShowMentions(false)
  }

  const handleRemoveMention = (mention: string) => {
    setMentions(mentions.filter(m => m !== mention))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Check for mention trigger
    const lastAtSign = value.lastIndexOf('@')
    if (lastAtSign !== -1 && (lastAtSign === 0 || value[lastAtSign - 1] === ' ')) {
      setShowMentions(true)
      setMentionFilter(value.substring(lastAtSign + 1))
    } else {
      setShowMentions(false)
    }
  }

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, mentions)
      setMessage('')
      setMentions([])
      setMentionFilter('')
      setShowMentions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-4">
        <h2 className="text-lg font-bold text-foreground mb-1">{thread.title}</h2>
        <p className="text-sm text-muted-foreground">
          {thread.participants.join(', ')}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4">
        {thread.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">No messages yet</p>
              <p className="text-muted-foreground">Start the conversation with @mentions</p>
            </div>
          </div>
        ) : (
          <>
            {thread.messages.map(msg => (
              <div key={msg.id} className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm">
                  {msg.author.charAt(0).toUpperCase()}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="font-semibold text-foreground">{msg.author}</p>
                    <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-3">
                    <p className="text-foreground text-sm break-words">{msg.content}</p>
                  </div>

                  {/* Mentions */}
                  {msg.mentions.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {msg.mentions.map(mention => (
                        <span key={mention} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          @{mention}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-6">
        {/* Mentions Tags */}
        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
            {mentions.map(mention => (
              <div key={mention} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                @{mention}
                <button
                  onClick={() => handleRemoveMention(mention)}
                  className="ml-1 hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Field */}
        <div className="relative">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... Use @ to mention agents"
            rows={3}
            className="w-full px-4 py-3 border border-input bg-background rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />

          {/* Mention Suggestions */}
          {showMentions && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg z-10">
              {availableMentions.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {availableMentions.map(agent => (
                    <button
                      key={agent}
                      onClick={() => handleMentionSelect(agent)}
                      className="w-full text-left px-4 py-2 hover:bg-accent transition-all flex items-center gap-2 text-foreground"
                    >
                      <AtSign className="w-4 h-4 text-muted-foreground" />
                      {agent}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No matches
                </div>
              )}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Send message (Ctrl+Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">Press Ctrl+Enter to send</p>
      </div>
    </div>
  )
}
