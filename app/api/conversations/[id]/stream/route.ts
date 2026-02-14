import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { sendMessageSchema } from '@/lib/validation'
import { streamLLM, getUserApiKey, LLMMessage } from '@/lib/llm'

export const dynamic = 'force-dynamic'

// POST /api/conversations/:id/stream — SSE streaming response
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
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

  const agent = conversation.agent
  const model = agent.model || 'gpt-4o-mini'
  const config = (agent.config as Record<string, unknown>) || {}

  let provider = 'openrouter'
  if (model.startsWith('claude') || model.startsWith('anthropic/')) provider = 'anthropic'
  else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('openai/')) provider = 'openai'

  const apiKey = await getUserApiKey(ctx.userId, provider)
  if (!apiKey) {
    return NextResponse.json({ error: `No API key for provider "${provider}"` }, { status: 400 })
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: { conversationId: params.id, role: 'USER', content: parsed.data.content },
  })

  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })

  // Load history
  const history = await prisma.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  const messages: LLMMessage[] = history.map(m => ({
    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: m.content,
  }))

  let systemPrompt = agent.systemPrompt || ''
  if (agent.constraints.length > 0) {
    systemPrompt += `\n\nConstraints:\n${agent.constraints.map(c => `- ${c}`).join('\n')}`
  }
  if (agent.role) systemPrompt = `You are a ${agent.role}.\n\n${systemPrompt}`

  const startTime = Date.now()
  const encoder = new TextEncoder()

  // Send userMessage id first, then stream LLM
  const llmStream = streamLLM({
    model,
    messages,
    systemPrompt: systemPrompt || undefined,
    temperature: (config.temperature as number) ?? 0.7,
    max_tokens: (config.max_tokens as number) ?? 4096,
    stream: true,
  }, apiKey)

  const wrappedStream = new ReadableStream({
    async start(controller) {
      // Send user message confirmation
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`))

      const reader = llmStream.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          // Forward SSE chunks, check for final message
          controller.enqueue(value)

          // Parse for done event to save to DB
          const lines = text.split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) {
                const duration = Date.now() - startTime
                // Save assistant message
                const assistantMessage = await prisma.message.create({
                  data: {
                    conversationId: params.id,
                    role: 'ASSISTANT',
                    content: data.content,
                    tokensUsed: data.tokensUsed || 0,
                    metadata: { model, cost: data.cost, promptTokens: data.promptTokens, completionTokens: data.completionTokens },
                  },
                })

                await prisma.execution.create({
                  data: {
                    agentId: agent.id,
                    teamId: ctx.teamId,
                    userId: ctx.userId,
                    trigger: 'Chat',
                    status: 'SUCCESS',
                    input: parsed.data.content,
                    output: data.content,
                    tokensUsed: data.tokensUsed || 0,
                    cost: data.cost || 0,
                    model,
                    duration,
                    completedAt: new Date(),
                  },
                })

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'assistant_message', message: assistantMessage })}\n\n`))
              }
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
      }
      controller.close()
    },
  })

  return new Response(wrappedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
