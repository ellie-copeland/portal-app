// Database Schema Types

export interface Workspace {
  id: string
  name: string
  created_at: string
  owner_id: string
}

export interface User {
  id: string
  email: string
  workspace_id: string
  created_at: string
}

export interface Agent {
  id: string
  workspace_id: string
  name: string
  description: string
  parent_agent_id: string | null
  created_at: string
}

export interface AgentConfig {
  id: string
  agent_id: string
  model: string
  temperature: number
  context_window: number
  system_prompt: string
  created_at: string
}

export interface ChatMessage {
  id: string
  workspace_id: string
  agent_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Task {
  id: string
  workspace_id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'stuck'
  assigned_to: string | null
  created_at: string
}

export interface UsageMetric {
  id: string
  workspace_id: string
  agent_id: string
  tokens_used: number
  api_calls: number
  cost: number
  created_at: string
}
