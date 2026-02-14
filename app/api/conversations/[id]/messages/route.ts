import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { sendMessageSchema } from '@/lib/validation'
import { callLLM, getUserApiKey, LLMMessage } from '@/lib/llm'

export const dynamic = 'force-dynamic'

// GET /api/conversations/:id/messages
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
  const before = req.nextUrl.searchParams.get('before')

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: ctx.userId },
  })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const messages = await prisma.message.findMany({
    where: {
      conversationId: params.id,
      ...(before && { createdAt: { lt: new Date(before) } }),
    },
    orderBy: { createdAt: 'asc' },
    take: Math.min(limit, 100),
  })

  return NextResponse.json({ messages })
}

// POST /api/conversations/:id/messages — Send message + get LLM response
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: ctx.userId },
    include: { agent: true },
  })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Save user message
  const userMessage = await prisma.message.create({
    data: { conversationId: params.id, role: 'USER', content: parsed.data.content },
  })

  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })

  // Determine provider and get API key
  const agent = conversation.agent
  const model = agent.model || 'gpt-4o-mini'
  const config = (agent.config as Record<string, unknown>) || {}

  // Get provider from model name for key lookup
  let provider = 'openrouter'
  if (model.startsWith('claude') || model.startsWith('anthropic/')) provider = 'anthropic'
  else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('openai/')) provider = 'openai'

  const apiKey = await getUserApiKey(ctx.userId, provider)
  if (!apiKey) {
    // Save error as assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: params.id,
        role: 'ASSISTANT',
        content: `⚠️ No API key configured for provider "${provider}". Please add one in Settings → API Keys.`,
      },
    })
    return NextResponse.json({ userMessage, assistantMessage }, { status: 201 })
  }

  // Load conversation history (last 50)
  const history = await prisma.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  const messages: LLMMessage[] = history.map(m => ({
    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: m.content,
  }))

  // Build system prompt
  let systemPrompt = agent.systemPrompt || ''
  if (agent.constraints.length > 0) {
    systemPrompt += `\n\nConstraints:\n${agent.constraints.map(c => `- ${c}`).join('\n')}`
  }
  if (agent.role) {
    systemPrompt = `You are a ${agent.role}.\n\n${systemPrompt}`
  }

  try {
    const startTime = Date.now()
    const llmResponse = await callLLM({
      model,
      messages,
      systemPrompt: systemPrompt || undefined,
      temperature: (config.temperature as number) ?? 0.7,
      max_tokens: (config.max_tokens as number) ?? 4096,
    }, apiKey)

    const duration = Date.now() - startTime

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: params.id,
        role: 'ASSISTANT',
        content: llmResponse.content,
        tokensUsed: llmResponse.tokensUsed,
        metadata: { model: llmResponse.model, cost: llmResponse.cost, promptTokens: llmResponse.promptTokens, completionTokens: llmResponse.completionTokens },
      },
    })

    // Create execution record
    await prisma.execution.create({
      data: {
        agentId: agent.id,
        teamId: ctx.teamId,
        userId: ctx.userId,
        trigger: 'Chat',
        status: 'SUCCESS',
        input: parsed.data.content,
        output: llmResponse.content,
        tokensUsed: llmResponse.tokensUsed,
        cost: llmResponse.cost,
        model: llmResponse.model,
        duration,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ userMessage, assistantMessage }, { status: 201 })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown LLM error'
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: params.id,
        role: 'ASSISTANT',
        content: `❌ Error: ${errorMsg}`,
      },
    })

    await prisma.execution.create({
      data: {
        agentId: agent.id,
        teamId: ctx.teamId,
        userId: ctx.userId,
        trigger: 'Chat',
        status: 'FAILED',
        input: parsed.data.content,
        error: errorMsg,
        model,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ userMessage, assistantMessage }, { status: 201 })
  }
}
