import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { callLLM, getUserApiKey, LLMMessage } from '@/lib/llm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const chatSchema = z.object({
  content: z.string().min(1).max(10000),
  agentId: z.string(),
  conversationId: z.string().nullable().optional(),
})

// POST - Simple "chat with an agent" endpoint
export async function POST(req: NextRequest) {
  const limited = rateLimit(getClientIp(req), 'llm')
  if (limited) return limited

  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { content, agentId, conversationId: rawConvId } = parsed.data
  const conversationId = rawConvId || undefined

  // Verify agent access
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, teamId: ctx.teamId },
  })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  // Get or create conversation
  let convId = conversationId
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: {
        agentId,
        userId: ctx.userId,
        title: content.slice(0, 100),
      },
    })
    convId = conv.id
  } else {
    const conv = await prisma.conversation.findFirst({
      where: { id: convId, userId: ctx.userId },
    })
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: { conversationId: convId, role: 'USER', content },
  })

  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  })

  // Get API key
  const model = agent.model || 'gpt-4o-mini'
  const config = (agent.config as Record<string, unknown>) || {}
  let provider = 'openrouter'
  if (model.startsWith('claude') || model.startsWith('anthropic/')) provider = 'anthropic'
  else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('openai/')) provider = 'openai'

  const apiKey = await getUserApiKey(ctx.userId, provider)
  if (!apiKey) {
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: convId,
        role: 'ASSISTANT',
        content: `⚠️ No API key configured for provider "${provider}". Add one via POST /api/keys.`,
      },
    })
    return NextResponse.json({ conversationId: convId, userMessage, assistantMessage }, { status: 201 })
  }

  // Load current conversation history
  const history = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'asc' },
    take: 20, // Limit current conversation context to save tokens
  })

  // Load brief context from most recent prior conversation only
  const priorConversations = await prisma.conversation.findMany({
    where: { agentId, userId: ctx.userId, id: { not: convId } },
    orderBy: { updatedAt: 'desc' },
    take: 1,
    select: { id: true },
  })

  let priorContext = ''
  if (priorConversations.length > 0) {
    const priorMessages = await prisma.message.findMany({
      where: { conversationId: priorConversations[0].id },
      orderBy: { createdAt: 'desc' },
      take: 6, // Just last 3 exchanges from prior conversation
    })
    if (priorMessages.length > 0) {
      const summary = priorMessages.reverse().map(m =>
        `${m.role === 'USER' ? 'User' : 'You'}: ${m.content.slice(0, 200)}`
      ).join('\n')
      priorContext = `\n\n## Previous Conversation History\nYou have memory of past conversations with this user. Here are recent messages from prior sessions:\n${summary}\n\nUse this context naturally — don't mention it unless asked.`
    }
  }

  const messages: LLMMessage[] = history.map(m => ({
    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: m.content,
  }))

  let systemPrompt = agent.systemPrompt || ''
  if (agent.constraints.length > 0) systemPrompt += `\n\nConstraints:\n${agent.constraints.map(c => `- ${c}`).join('\n')}`
  if (agent.role) systemPrompt = `You are a ${agent.role}.\n\n${systemPrompt}`
  if (priorContext) systemPrompt += priorContext

  try {
    const startTime = Date.now()
    const llmResponse = await callLLM({
      model,
      messages,
      systemPrompt: systemPrompt || undefined,
      temperature: (config.temperature as number) ?? 0.7,
      max_tokens: (config.max_tokens as number) ?? 4096,
    }, apiKey)

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: convId,
        role: 'ASSISTANT',
        content: llmResponse.content,
        tokensUsed: llmResponse.tokensUsed,
        metadata: { model: llmResponse.model, cost: llmResponse.cost },
      },
    })

    await prisma.execution.create({
      data: {
        agentId: agent.id,
        teamId: ctx.teamId,
        userId: ctx.userId,
        trigger: 'Chat',
        status: 'SUCCESS',
        input: content,
        output: llmResponse.content,
        tokensUsed: llmResponse.tokensUsed,
        cost: llmResponse.cost,
        model: llmResponse.model,
        duration: Date.now() - startTime,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ conversationId: convId, userMessage, assistantMessage }, { status: 201 })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    const assistantMessage = await prisma.message.create({
      data: { conversationId: convId, role: 'ASSISTANT', content: `❌ Error: ${errorMsg}` },
    })
    return NextResponse.json({ conversationId: convId, userMessage, assistantMessage }, { status: 201 })
  }
}
