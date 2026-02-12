'use client'

import { useState } from 'react'

interface Message {
  id: string
  agent: string
  content: string
  timestamp: string
  isUser: boolean
}

export default function ChatThread() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      agent: 'Master Agent',
      content: 'Welcome to the unified chat. All agents can communicate here.',
      timestamp: new Date().toISOString(),
      isUser: false,
    },
  ])

  const [messageInput, setMessageInput] = useState('')

  const sendMessage = () => {
    if (!messageInput.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      agent: 'You',
      content: messageInput,
      timestamp: new Date().toISOString(),
      isUser: true,
    }

    setMessages([...messages, newMessage])
    setMessageInput('')

    // Simulate agent response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          agent: 'Assistant',
          content: 'Message received and processed.',
          timestamp: new Date().toISOString(),
          isUser: false,
        },
      ])
    }, 500)
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-screen max-h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm font-medium">{msg.agent}</p>
              <p className="text-sm mt-1">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
