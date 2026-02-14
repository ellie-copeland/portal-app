import { z } from 'zod'

// Sanitize HTML to prevent XSS
const sanitize = (val: string) => val.replace(/<[^>]*>/g, '').trim()
const safeString = (max: number) => z.string().max(max).transform(sanitize)

// Auth
export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

export const signinSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

// Teams
export const createTeamSchema = z.object({
  name: safeString(100).pipe(z.string().min(1, 'Team name is required')),
})

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
})

// Agents
export const createAgentSchema = z.object({
  name: safeString(100).pipe(z.string().min(1)),
  description: safeString(500).optional(),
  type: z.enum(['MAIN', 'SUB']).default('MAIN'),
  model: z.string().max(50).default('gpt-4'),
  systemPrompt: z.string().max(10000).optional(),
  constraints: z.array(z.string().max(200)).max(20).default([]),
  role: safeString(100).optional(),
  config: z.record(z.string(), z.any()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const updateAgentSchema = createAgentSchema.partial()

// Tasks
export const createTaskSchema = z.object({
  title: safeString(200).pipe(z.string().min(1)),
  description: safeString(2000).optional(),
  status: z.enum(['TODO', 'DOING', 'STUCK', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  agentId: z.string().optional(),
  recurring: z.string().default('none'),
  scheduled: z.boolean().default(false),
  dueDate: z.string().datetime().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  position: z.number().int().optional(),
})

// Conversations
export const createConversationSchema = z.object({
  agentId: z.string(),
  title: z.string().max(200).optional(),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

// Executions
export const executeAgentSchema = z.object({
  input: z.string().min(1).max(10000),
  trigger: z.string().default('Manual'),
})

// User
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
})

export const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  slackNotifications: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

// Monitoring
export const createWatchRuleSchema = z.object({
  name: safeString(100).pipe(z.string().min(1)),
  condition: z.string().min(1),
  source: z.string().min(1),
  escalation: z.enum(['auto', 'notify', 'manual']).default('notify'),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.any()).optional(),
})
