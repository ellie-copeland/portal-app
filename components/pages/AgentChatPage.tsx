'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bot, Phone, AlertCircle, Loader2, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { authHeaders } from '@/lib/fetch-auth'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'

interface Agent {
  id: string
  name: string
  model?: string
  status?: 'active' | 'inactive'
}

interface AgentChatPageProps {
  onNavigateToSettings?: (page: any) => void
}

// Render tool invocations inline
function ToolCallPart({ toolName, state, args, result }: {
  toolName: string
  state: string
  args: Record<string, unknown>
  result?: unknown
}) {
  const isRunning = state !== 'result'
  return (
    <div className="my-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        {isRunning && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        <span className="font-medium text-foreground">
          {toolName === 'scrapeWebpage' ? '🌐 Scraping webpage' :
           toolName === 'searchWeb' ? '🔍 Searching web' :
           toolName === 'fetchSubpage' ? '📄 Fetching subpage' :
           `🔧 ${toolName}`}
        </span>
        {args && (
          <span className="text-muted-foreground truncate max-w-[300px]">
            {toolName === 'searchWeb' ? `"${(args as any).query}"` :
             toolName === 'scrapeWebpage' ? `${(args as any).url}` :
             toolName === 'fetchSubpage' ? `${(args as any).baseUrl}${(args as any).path}` :
             JSON.stringify(args).slice(0, 60)}
          </span>
        )}
      </div>
      {state === 'result' && <div className="mt-1 text-muted-foreground">✓ Done</div>}
    </div>
  )
}

// Render message parts for assistant messages
function MessageParts({ message, isLastMessage, isStreaming }: {
  message: UIMessage
  isLastMessage: boolean
  isStreaming: boolean
}) {
  // Consolidate reasoning parts
  const reasoningParts = message.parts.filter((p): p is any => p.type === 'reasoning')
  const reasoningText = reasoningParts.map((p: any) => p.text).join('\n\n')
  const hasReasoning = reasoningParts.length > 0
  const lastPart = message.parts.at(-1)
  const isReasoningStreaming = isLastMessage && isStreaming && lastPart?.type === 'reasoning'

  return (
    <>
      {hasReasoning && (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}
      {message.parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <MessageResponse key={`${message.id}-${i}`}>
              {part.text}
            </MessageResponse>
          )
        }
        // Tool parts: type starts with 'tool-' (e.g. 'tool-scrapeWebpage')
        if (part.type.startsWith('tool-') && part.type !== 'tool-invocation') {
          const toolPart = part as any
          const toolName = part.type.replace('tool-', '')
          return (
            <ToolCallPart
              key={`${message.id}-${i}`}
              toolName={toolName}
              state={toolPart.state}
              args={toolPart.input ?? toolPart.args ?? {}}
              result={toolPart.output ?? toolPart.result}
            />
          )
        }
        // Dynamic tool parts
        if (part.type === 'dynamic-tool') {
          const toolPart = part as any
          return (
            <ToolCallPart
              key={`${message.id}-${i}`}
              toolName={toolPart.toolName}
              state={toolPart.state}
              args={toolPart.input ?? {}}
              result={toolPart.output}
            />
          )
        }
        return null
      })}
    </>
  )
}

export default function AgentChatPage({ onNavigateToSettings }: AgentChatPageProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState(false)
  const [checkingKeys, setCheckingKeys] = useState(true)
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')

  // Create transport with custom headers and body
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    headers: () => authHeaders(),
    body: () => ({
      agentId: selectedAgentId,
      conversationId,
    }),
    fetch: async (url, init) => {
      const response = await fetch(url, init)
      // Capture conversation ID from response header
      const newConvId = response.headers.get('X-Conversation-Id')
      if (newConvId && !conversationId) {
        setConversationId(newConvId)
      }
      return response
    },
  }), [selectedAgentId, conversationId])

  const {
    messages,
    sendMessage,
    setMessages,
    status,
  } = useChat({
    transport,
    onError(error) {
      console.error('Chat error:', error)
    },
  })

  const isStreaming = status === 'streaming'

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get<{ agents: Agent[] }>('/api/agents')
        const agentsList = response.agents || []
        setAgents(agentsList)

        if (agentsList.length > 0) {
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
          const msgRes = await fetch(`/api/conversations/${latest.id}/messages`, { headers: authHeaders() })
          if (msgRes.ok) {
            const msgData = await msgRes.json()
            const history: UIMessage[] = (msgData.messages || []).map((m: any) => ({
              id: m.id,
              role: m.role?.toLowerCase() === 'user' ? 'user' as const : 'assistant' as const,
              parts: [{ type: 'text' as const, text: m.content }],
              createdAt: new Date(m.createdAt),
            }))
            setMessages(history)
          }
        }
      }
    } catch {
      // No history available, start fresh
    }
  }

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    if (!message.text?.trim() || apiKeyError || !selectedAgentId) return
    sendMessage({ text: message.text })
    setInputText('')
  }, [apiKeyError, selectedAgentId, sendMessage])

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
                      <p className="text-sm font-medium truncate text-foreground">{name}</p>
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

        {/* Messages area */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {!loading && !checkingKeys && apiKeyError && (
            <div className="flex items-center justify-center h-full">
              <div className="max-w-sm text-center">
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
            </div>
          )}
          {!loading && !apiKeyError && (
            <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
              <Conversation className="flex-1 min-h-0">
                <ConversationContent className="px-2 py-4">
                  {messages.length === 0 && selectedAgent && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-semibold text-foreground mb-2">Chat with {selectedAgent}</p>
                      <p className="text-muted-foreground">Start a conversation to see messages here</p>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.role === 'user' ? (
                          message.parts.map((part, i) =>
                            part.type === 'text' ? (
                              <p key={`${message.id}-${i}`} className="text-sm whitespace-pre-wrap">{part.text}</p>
                            ) : null
                          )
                        ) : (
                          <MessageParts
                            message={message}
                            isLastMessage={index === messages.length - 1}
                            isStreaming={isStreaming}
                          />
                        )}
                      </MessageContent>
                    </Message>
                  ))}
                  {status === 'submitted' && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              {/* Input */}
              <PromptInput
                onSubmit={handleSubmit}
                className="mt-2 w-full max-w-3xl mx-auto"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    value={inputText}
                    onChange={(e) => setInputText(e.currentTarget.value)}
                    placeholder={selectedAgent ? `Message ${selectedAgent}...` : 'Select an agent first...'}
                    disabled={!selectedAgent || apiKeyError}
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools />
                  <PromptInputSubmit
                    disabled={!inputText.trim() || !selectedAgent || apiKeyError}
                    status={isStreaming ? 'streaming' : 'ready'}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
