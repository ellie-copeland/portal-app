import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { homedir } from 'os'

const HOME = homedir()
const OPENCLAW_CONFIG = path.join(HOME, '.openclaw', 'openclaw.json')
const AGENTS_DIR = path.join(HOME, '.openclaw', 'agents')

export interface OpenclaConfig {
  agents?: {
    defaults?: {
      model?: {
        primary?: string
      }
    }
  }
  bindings?: Record<string, unknown>
}

export interface SessionData {
  agentId: string
  sessionId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  updatedAt: number
  key: string
  kind: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface ChatSession {
  sessionId: string
  agentId: string
  messages: Message[]
  messageCount: number
}

export interface AgentStatus {
  agentId: string
  status: 'online' | 'idle' | 'offline'
  lastActivity: number
  activeSessions: number
  totalTokensUsed: number
  model: string
}

export interface CostData {
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costInput: number
  costOutput: number
  totalCost: number
}

// Token pricing (per 1M tokens)
const PRICING = {
  'anthropic/claude-opus-4-1': {
    input: 15,
    output: 75,
  },
  'anthropic/claude-haiku-4-5': {
    input: 0.8,
    output: 4,
  },
  local: {
    input: 0,
    output: 0,
  },
}

export function getOpenclaConfig(): OpenclaConfig {
  try {
    const content = fs.readFileSync(OPENCLAW_CONFIG, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to read openclaw.json:', error)
    return {}
  }
}

export function getStatusJSON(): SessionData[] {
  try {
    const output = execSync('openclaw status --json', { encoding: 'utf-8' })
    const data = JSON.parse(output)
    return data.sessions?.recent || []
  } catch (error) {
    console.error('Failed to get status:', error)
    return []
  }
}

export function getAgentSessions(): AgentStatus[] {
  const statusData = getStatusJSON()
  const agentMap = new Map<string, AgentStatus>()

  statusData.forEach((session) => {
    if (!agentMap.has(session.agentId)) {
      agentMap.set(session.agentId, {
        agentId: session.agentId,
        status: 'offline',
        lastActivity: 0,
        activeSessions: 0,
        totalTokensUsed: 0,
        model: session.model || '',
      })
    }

    const agent = agentMap.get(session.agentId)!
    agent.totalTokensUsed += session.totalTokens
    agent.activeSessions++
    agent.lastActivity = Math.max(agent.lastActivity, session.updatedAt)
    agent.model = session.model || agent.model

    // Determine status based on last activity
    const now = Date.now()
    const timeSinceActivity = now - agent.lastActivity
    const minutesSinceActivity = timeSinceActivity / (1000 * 60)

    if (minutesSinceActivity < 5) {
      agent.status = 'online'
    } else if (minutesSinceActivity < 60) {
      agent.status = 'idle'
    } else {
      agent.status = 'offline'
    }
  })

  return Array.from(agentMap.values())
}

export function parseSessionFile(filePath: string): Message[] {
  try {
    if (!fs.existsSync(filePath)) {
      return []
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter((line) => line.trim())
    const messages: Message[] = []

    lines.forEach((line, index) => {
      try {
        const entry = JSON.parse(line)
        if (entry.type === 'user_message' && entry.content) {
          messages.push({
            role: 'user',
            content: entry.content,
            timestamp: entry.timestamp || 0,
          })
        } else if (entry.type === 'assistant_message' && entry.content) {
          messages.push({
            role: 'assistant',
            content: entry.content,
            timestamp: entry.timestamp || 0,
          })
        }
      } catch (e) {
        // Skip parsing errors for individual lines
      }
    })

    return messages
  } catch (error) {
    console.error(`Failed to parse session file ${filePath}:`, error)
    return []
  }
}

export function getAllChatSessions(): ChatSession[] {
  const sessions: ChatSession[] = []
  const allSessions: ChatSession[] = []

  try {
    const agents = fs.readdirSync(AGENTS_DIR)

    agents.forEach((agentId) => {
      const sessionsDir = path.join(AGENTS_DIR, agentId, 'sessions')
      if (!fs.existsSync(sessionsDir)) return

      const files = fs.readdirSync(sessionsDir)
      files.forEach((file) => {
        if (file.endsWith('.jsonl') && !file.endsWith('.lock')) {
          const filePath = path.join(sessionsDir, file)
          const messages = parseSessionFile(filePath)

          if (messages.length > 0) {
            allSessions.push({
              sessionId: file.replace('.jsonl', ''),
              agentId,
              messages,
              messageCount: messages.length,
            })
          }
        }
      })
    })
  } catch (error) {
    console.error('Failed to read chat sessions:', error)
  }

  // Return 200 most recent messages across all sessions
  const allMessages: (Message & { sessionId: string; agentId: string })[] = []

  allSessions.forEach((session) => {
    session.messages.forEach((msg) => {
      allMessages.push({
        ...msg,
        sessionId: session.sessionId,
        agentId: session.agentId,
      })
    })
  })

  // Sort by timestamp descending and take 200
  allMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  return allMessages.slice(0, 200).map((msg) => ({
    sessionId: msg.sessionId,
    agentId: msg.agentId,
    messages: [msg],
    messageCount: 1,
  }))
}

export function calculateUsageAndCost(): CostData[] {
  const statusData = getStatusJSON()
  const costMap = new Map<string, CostData>()

  statusData.forEach((session) => {
    const model = session.model || 'unknown'
    let pricing = PRICING['anthropic/claude-haiku-4-5'] // default

    // Match pricing based on model name
    if (model.includes('opus')) {
      pricing = PRICING['anthropic/claude-opus-4-1']
    } else if (model.includes('haiku')) {
      pricing = PRICING['anthropic/claude-haiku-4-5']
    } else if (model.includes('local')) {
      pricing = PRICING['local']
    }

    if (!costMap.has(model)) {
      costMap.set(model, {
        model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costInput: 0,
        costOutput: 0,
        totalCost: 0,
      })
    }

    const cost = costMap.get(model)!
    const inputTokens = session.inputTokens || 0
    const outputTokens = session.outputTokens || 0

    cost.inputTokens += inputTokens
    cost.outputTokens += outputTokens
    cost.totalTokens += session.totalTokens || 0

    // Calculate costs
    cost.costInput = (cost.inputTokens / 1000000) * pricing.input
    cost.costOutput = (cost.outputTokens / 1000000) * pricing.output
    cost.totalCost = cost.costInput + cost.costOutput
  })

  return Array.from(costMap.values())
}

export function getActivityLog(limit: number = 100) {
  const statusData = getStatusJSON()
  const activities = statusData
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit)
    .map((session) => ({
      timestamp: session.updatedAt || 0,
      agentId: session.agentId,
      sessionId: session.sessionId,
      key: session.key,
      kind: session.kind,
      tokensUsed: session.totalTokens,
      model: session.model,
    }))

  return activities
}

export function getHeartbeatData() {
  try {
    const output = execSync('openclaw status --json', { encoding: 'utf-8' })
    const data = JSON.parse(output)
    return data.heartbeat || { agents: [], defaultAgentId: '' }
  } catch (error) {
    console.error('Failed to get heartbeat data:', error)
    return { agents: [], defaultAgentId: '' }
  }
}

export interface Conversation {
  context: string // e.g., "iMessage Mike", "Slack #dev-team"
  platform: 'imessage' | 'slack' | 'email' | 'other'
  recipient: string // e.g., "Mike", "#dev-team", "user@example.com"
  lastMessage: string
  lastTimestamp: number
  messageCount: number
  sender?: string
  preview?: string
}

export interface ConversationGroup {
  context: string
  platform: 'imessage' | 'slack' | 'email' | 'other'
  recipient: string
  count: number
  lastTimestamp: number
  lastMessage: string
  preview: string
  messages: Array<{
    sender: string
    content: string
    timestamp: number
  }>
}

// Detect platform and recipient from message content or session context
function detectContextFromContent(
  content: string,
  sessionId: string,
  agentId: string
): { platform: 'imessage' | 'slack' | 'email' | 'other'; recipient: string } {
  // Check for Slack mentions/channels
  if (content.includes('#dev-team') || content.includes('Slack #dev-team')) {
    return { platform: 'slack', recipient: '#dev-team' }
  }
  if (content.includes('#agent-team') || content.includes('Slack #agent-team')) {
    return { platform: 'slack', recipient: '#agent-team' }
  }
  if (content.match(/@\w+/)) {
    const match = content.match(/@(\w+)/)
    if (match) {
      return { platform: 'slack', recipient: `@${match[1]}` }
    }
  }

  // Check for iMessage patterns
  if (content.includes('iMessage') || content.match(/\[.*Mike.*\]/)) {
    return { platform: 'imessage', recipient: 'Mike' }
  }

  // Check for email patterns
  if (content.match(/[\w\.-]+@[\w\.-]+\.\w+/)) {
    const match = content.match(/([\w\.-]+@[\w\.-]+\.\w+)/)
    if (match) {
      return { platform: 'email', recipient: match[1] }
    }
  }

  // Default based on agent/session
  if (content.includes('message')) {
    return { platform: 'other', recipient: agentId || 'Unknown' }
  }

  return { platform: 'other', recipient: agentId || 'Unknown' }
}

export function getConversationsByContext(): ConversationGroup[] {
  const conversationMap = new Map<string, ConversationGroup>()

  try {
    const agents = fs.readdirSync(AGENTS_DIR)

    agents.forEach((agentId) => {
      const sessionsDir = path.join(AGENTS_DIR, agentId, 'sessions')
      if (!fs.existsSync(sessionsDir)) return

      const files = fs.readdirSync(sessionsDir)
      files.forEach((file) => {
        if (file.endsWith('.jsonl') && !file.endsWith('.lock') && !file.includes('.deleted')) {
          const filePath = path.join(sessionsDir, file)

          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            const lines = content.split('\n').filter((line) => line.trim())

            lines.forEach((line) => {
              try {
                const entry = JSON.parse(line)

                // Process message entries
                if (entry.type === 'message' && entry.message) {
                  const msg = entry.message
                  const content = msg.content
                    ? typeof msg.content === 'string'
                      ? msg.content
                      : Array.isArray(msg.content)
                        ? msg.content.map((c: any) => c.text || '').join(' ')
                        : ''
                    : ''

                  if (content && content.trim()) {
                    const { platform, recipient } = detectContextFromContent(content, file, agentId)
                    const contextKey = `${platform}:${recipient}`
                    const timestamp = entry.timestamp ? new Date(entry.timestamp).getTime() : 0

                    if (!conversationMap.has(contextKey)) {
                      conversationMap.set(contextKey, {
                        context: `${platform === 'slack' ? 'Slack ' : platform === 'imessage' ? 'iMessage ' : platform === 'email' ? 'Email ' : ''}${recipient}`.trim(),
                        platform,
                        recipient,
                        count: 0,
                        lastTimestamp: 0,
                        lastMessage: '',
                        preview: '',
                        messages: [],
                      })
                    }

                    const group = conversationMap.get(contextKey)!
                    group.count++
                    group.messages.push({
                      sender: msg.role || 'unknown',
                      content: content.substring(0, 500), // Store first 500 chars
                      timestamp,
                    })

                    // Update last message if this one is newer
                    if (timestamp > group.lastTimestamp) {
                      group.lastTimestamp = timestamp
                      group.lastMessage = content.substring(0, 100)
                      group.preview = content.substring(0, 150)
                    }
                  }
                }
              } catch (e) {
                // Skip parsing errors
              }
            })
          } catch (error) {
            // Skip file read errors
          }
        }
      })
    })
  } catch (error) {
    console.error('Failed to read conversations:', error)
  }

  // Convert map to array and sort by last activity
  const conversations = Array.from(conversationMap.values())
  conversations.sort((a, b) => b.lastTimestamp - a.lastTimestamp)

  return conversations
}
