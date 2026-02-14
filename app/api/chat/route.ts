import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { getUserApiKey } from '@/lib/llm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, tool, stepCountIs, zodSchema } from 'ai'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const chatSchema = z.object({
  content: z.string().min(1).max(10000),
  agentId: z.string(),
  conversationId: z.string().nullable().optional(),
})

// Clean Slack-formatted URLs: <http://example.com|example.com> → http://example.com
function cleanUrl(url: string): string {
  // Handle Slack mrkdwn format
  const slackMatch = url.match(/<(https?:\/\/[^|>]+)/)
  if (slackMatch) return slackMatch[1]
  // Add protocol if missing
  if (!url.startsWith('http')) return `https://${url}`
  return url
}

// Web scraper with meta tag extraction for SPAs
async function scrapeWebpageExecute({ url: rawUrl }: { url: string }): Promise<{ url: string; title: string; content: string; error?: string }> {
  const url = cleanUrl(rawUrl)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return { url, title: '', content: '', error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : ''

    // Extract meta tags (critical for SPAs that render client-side)
    const metaParts: string[] = []
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (descMatch) metaParts.push(`Description: ${descMatch[1]}`)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    if (ogTitleMatch) metaParts.push(`Title: ${ogTitleMatch[1]}`)
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    if (ogDescMatch) metaParts.push(`About: ${ogDescMatch[1]}`)
    // Extract any JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1])
        if (ld.name) metaParts.push(`Name: ${ld.name}`)
        if (ld.description) metaParts.push(`Description: ${ld.description}`)
        if (ld.offers) metaParts.push(`Pricing: ${JSON.stringify(ld.offers)}`)
      } catch {}
    }

    // Strip HTML to get text content
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()

    // Combine meta info + body text
    const metaSection = metaParts.length > 0 ? `## Page Metadata\n${metaParts.join('\n')}\n\n## Page Content\n` : ''
    const fullContent = metaSection + textContent

    const truncated = fullContent.length > 8000
      ? fullContent.slice(0, 8000) + '\n\n[Content truncated...]'
      : fullContent

    // If content is very short (SPA with no server-rendered content), also try fetching subpages
    if (textContent.length < 200 && metaParts.length > 0) {
      // Try /pricing page
      try {
        const pricingRes = await fetch(`${url.replace(/\/$/, '')}/pricing`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        })
        if (pricingRes.ok) {
          const pricingHtml = await pricingRes.text()
          const pricingText = pricingHtml
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          if (pricingText.length > 100) {
            return { url, title, content: truncated + `\n\n## Pricing Page\n${pricingText.slice(0, 4000)}` }
          }
        }
      } catch {}
    }

    return { url, title, content: truncated }
  } catch (err) {
    return { url, title: '', content: '', error: `Failed to scrape: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Model name mapping (display name → API model ID)
const MODEL_ID_MAP: Record<string, string> = {
  'claude-opus-4': 'claude-opus-4-20250514',
  'claude-sonnet-4': 'claude-sonnet-4-20250514',
  'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
  'claude-haiku-4': 'claude-3-5-haiku-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-sonnet': 'claude-sonnet-4-20250514',
  'claude-opus': 'claude-opus-4-20250514',
  'claude-haiku': 'claude-3-5-haiku-20241022',
}

function cleanModel(model: string): string {
  const stripped = model.replace(/^(anthropic|openai|openrouter)\//, '')
  return MODEL_ID_MAP[stripped] || stripped
}

function detectProvider(model: string): 'anthropic' | 'openai' | 'google' | 'openrouter' {
  if (model.startsWith('claude') || model.startsWith('anthropic/')) return 'anthropic'
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('openai/')) return 'openai'
  if (model.startsWith('gemini') || model.startsWith('google/')) return 'google'
  return 'openrouter'
}

// Use direct provider SDKs instead of routing everything through OpenRouter
function getProviderForModel(model: string, apiKey: string) {
  const provider = detectProvider(model)
  const modelId = cleanModel(model)

  if (provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey })
    return anthropic(modelId)
  }

  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey })
    return openai(modelId)
  }

  if (provider === 'google') {
    const google = createGoogleGenerativeAI({ apiKey })
    return google(modelId)
  }

  // Fallback: OpenRouter for everything else
  const openrouter = createOpenAICompatible({
    name: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: { 'HTTP-Referer': 'https://portal-app-gamma.vercel.app' },
  })
  return openrouter(model)
}

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

  if (agent.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Bot not active. Please activate the agent before sending messages.' }, { status: 403 })
  }

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
  await prisma.message.create({
    data: { conversationId: convId, role: 'USER', content },
  })

  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  })

  // Get API key
  const model = agent.model || 'gpt-4o-mini'
  const config = (agent.config as Record<string, unknown>) || {}
  const provider = detectProvider(model)

  const apiKey = await getUserApiKey(ctx.userId, provider)
  if (!apiKey) {
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: 'ASSISTANT',
        content: `⚠️ No API key configured for provider "${provider}". Add one via POST /api/keys.`,
      },
    })
    return NextResponse.json({
      error: `No API key for "${provider}"`,
      conversationId: convId,
    }, { status: 400 })
  }

  // Load conversation history (filter out error/system messages)
  const rawHistory = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'asc' },
    take: 30,
  })
  const history = rawHistory.filter(m =>
    m.content &&
    m.content.trim().length > 0 &&
    !m.content.startsWith('❌') &&
    !m.content.startsWith('⚠️')
  ).slice(-20)

  // Load brief context from most recent prior conversation
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
      take: 6,
    })
    if (priorMessages.length > 0) {
      const summary = priorMessages.reverse().map(m =>
        `${m.role === 'USER' ? 'User' : 'You'}: ${m.content.slice(0, 200)}`
      ).join('\n')
      priorContext = `\n\n## Previous Conversation History\n${summary}\n\nUse this context naturally — don't mention it unless asked.`
    }
  }

  // Build system prompt
  let systemPrompt = agent.systemPrompt || ''
  if (agent.constraints.length > 0) systemPrompt += `\n\nConstraints:\n${agent.constraints.map(c => `- ${c}`).join('\n')}`
  if (agent.role) systemPrompt = `You are a ${agent.role}.\n\n${systemPrompt}`
  if (priorContext) systemPrompt += priorContext

  // Build messages for AI SDK
  const messages = history.map(m => ({
    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: m.content,
  }))

  const startTime = Date.now()
  const modelInstance = getProviderForModel(model, apiKey)

  try {
    const result = streamText({
      model: modelInstance,
      system: systemPrompt || undefined,
      messages,
      temperature: (config.temperature as number) ?? 0.7,
      maxOutputTokens: (config.max_tokens as number) ?? 4096,
      tools: {
        scrapeWebpage: tool({
          description: 'Scrape a webpage and extract its content as markdown. Use this when you need to read or analyze web page content.',
          inputSchema: zodSchema(z.object({
            url: z.string().describe('The URL of the webpage to scrape'),
          })),
          execute: scrapeWebpageExecute,
        }),
      },
      stopWhen: stepCountIs(3), // Allow up to 3 tool-calling rounds
      async onFinish({ text, totalUsage }) {
        // Save assistant message to DB
        const tokensUsed = (totalUsage?.inputTokens || 0) + (totalUsage?.outputTokens || 0)
        await prisma.message.create({
          data: {
            conversationId: convId!,
            role: 'ASSISTANT',
            content: text,
            tokensUsed,
            metadata: { model },
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
            output: text,
            tokensUsed,
            cost: 0,
            model,
            duration: Date.now() - startTime,
            completedAt: new Date(),
          },
        })
      },
    })

    // Stream plain text chunks (not AI SDK protocol format)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of result.textStream) {
            if (chunk) {
              controller.enqueue(encoder.encode(chunk))
            }
          }
        } catch (err) {
          console.error('Stream error:', err)
          const errMsg = err instanceof Error ? err.message : String(err)
          controller.enqueue(encoder.encode(`\n\n❌ Stream error: ${errMsg}`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Conversation-Id': convId!,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    await prisma.message.create({
      data: { conversationId: convId!, role: 'ASSISTANT', content: `❌ Error: ${errorMsg}` },
    })
    return NextResponse.json({ error: errorMsg, conversationId: convId }, { status: 500 })
  }
}
