import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { getUserApiKey } from '@/lib/llm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, tool, stepCountIs, zodSchema, UIMessage, convertToModelMessages } from 'ai'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Clean Slack-formatted URLs: <http://example.com|example.com> → http://example.com
function cleanUrl(url: string): string {
  const slackMatch = url.match(/<(https?:\/\/[^|>]+)/)
  if (slackMatch) return slackMatch[1]
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
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : ''

    const metaParts: string[] = []
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (descMatch) metaParts.push(`Description: ${descMatch[1]}`)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    if (ogTitleMatch) metaParts.push(`Title: ${ogTitleMatch[1]}`)
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    if (ogDescMatch) metaParts.push(`About: ${ogDescMatch[1]}`)
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1])
        if (ld.name) metaParts.push(`Name: ${ld.name}`)
        if (ld.description) metaParts.push(`Description: ${ld.description}`)
        if (ld.offers) metaParts.push(`Pricing: ${JSON.stringify(ld.offers)}`)
      } catch {}
    }

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

    const metaSection = metaParts.length > 0 ? `## Page Metadata\n${metaParts.join('\n')}\n\n## Page Content\n` : ''
    const fullContent = metaSection + textContent

    const truncated = fullContent.length > 8000
      ? fullContent.slice(0, 8000) + '\n\n[Content truncated...]'
      : fullContent

    if (textContent.length < 200 && metaParts.length > 0) {
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

// Model name mapping
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

  const openrouter = createOpenAICompatible({
    name: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: { 'HTTP-Referer': 'https://portal-app-gamma.vercel.app' },
  })
  return openrouter(model)
}

export async function POST(req: NextRequest) {
  try {
  const limited = rateLimit(getClientIp(req), 'llm')
  if (limited) return limited

  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()

  // Extract our custom fields from body
  const { messages: uiMessages, agentId, conversationId: rawConvId } = body as {
    messages: UIMessage[]
    agentId: string
    conversationId?: string | null
  }

  if (!agentId || !uiMessages?.length) {
    return NextResponse.json({ error: 'agentId and messages are required' }, { status: 400 })
  }

  // Get the latest user message content for DB storage
  const lastUserMsg = [...uiMessages].reverse().find(m => m.role === 'user')
  const textParts = lastUserMsg?.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text) || []
  const fileParts = lastUserMsg?.parts
    ?.filter((p): p is any => p.type === 'file') || []
  const fileNames = fileParts.map((f: any) => f.filename || 'file').join(', ')
  const userContent = [
    ...textParts,
    ...(fileNames ? [`[Attached: ${fileNames}]`] : []),
  ].join('\n') || ''

  // Verify agent access
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, teamId: ctx.teamId },
  })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  if (agent.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Bot not active. Please activate the agent before sending messages.' }, { status: 403 })
  }

  // Get or create conversation
  let convId = rawConvId || undefined
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: {
        agentId,
        userId: ctx.userId,
        title: userContent.slice(0, 100),
      },
    })
    convId = conv.id
  } else {
    const conv = await prisma.conversation.findFirst({
      where: { id: convId, userId: ctx.userId },
    })
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Save user message to DB
  await prisma.message.create({
    data: { conversationId: convId, role: 'USER', content: userContent },
  })

  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  })

  // Get API key
  const model = agent.model
  if (!model) {
    return NextResponse.json({ error: 'No model configured for this agent. Edit the agent and select a model.' }, { status: 400 })
  }
  const config = (agent.config as Record<string, unknown>) || {}
  const provider = detectProvider(model)

  const apiKey = await getUserApiKey(ctx.userId, provider)
  if (!apiKey) {
    return NextResponse.json({
      error: `No API key for "${provider}"`,
      conversationId: convId,
    }, { status: 400 })
  }

  // Load prior conversation context
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

  const startTime = Date.now()
  const modelInstance = getProviderForModel(model, apiKey)

  // Convert UIMessages to model messages (preserves tool-call and tool-result parts for multi-step)
  let modelMessages: any[]
  try {
    modelMessages = await convertToModelMessages(uiMessages)
  } catch (convErr) {
    // Fallback: extract text only (tool calls won't work in multi-step)
    console.warn('convertToModelMessages failed, falling back to text-only:', convErr)
    modelMessages = uiMessages
      .filter((m: UIMessage) => m.role === 'user' || m.role === 'assistant')
      .map((m: UIMessage) => {
        const text = m.parts
          ?.filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('\n') || (m as any).content || ''
        return { role: m.role as 'user' | 'assistant', content: text }
      })
      .filter(m => m.content.trim().length > 0)
  }

  if (!modelMessages || modelMessages.length === 0) {
    return NextResponse.json({ error: 'No valid messages to send' }, { status: 400 })
  }

  try {
    const result = streamText({
      model: modelInstance,
      system: systemPrompt || undefined,
      messages: modelMessages,
      temperature: (config.temperature as number) ?? 0.7,
      maxOutputTokens: (config.max_tokens as number) ?? 4096,
      tools: {
        scrapeWebpage: tool({
          description: 'Fetch a specific webpage URL and extract its content. Best for known URLs. For JS-heavy sites (SPAs), content may be limited to meta tags.',
          inputSchema: zodSchema(z.object({
            url: z.string().describe('The URL of the webpage to scrape'),
          })),
          execute: scrapeWebpageExecute,
        }),
        searchWeb: tool({
          description: 'Search the web using Google. Use this to find pricing, features, reviews, or any information. Returns titles, snippets, and URLs from search results.',
          inputSchema: zodSchema(z.object({
            query: z.string().describe('The search query'),
          })),
          execute: async ({ query }: { query: string }) => {
            try {
              const res = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=8`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: AbortSignal.timeout(10000),
              })
              if (!res.ok) return { query, results: [], error: `Search failed: HTTP ${res.status}` }
              const html = await res.text()
              const textContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim()
              const truncated = textContent.length > 6000 ? textContent.slice(0, 6000) : textContent
              return { query, content: truncated }
            } catch (err) {
              return { query, content: '', error: `Search failed: ${err instanceof Error ? err.message : String(err)}` }
            }
          },
        }),
        fetchSubpage: tool({
          description: 'Fetch a specific subpage of a website (e.g., /pricing, /about, /features). Use when you know a website has a specific page with the information needed.',
          inputSchema: zodSchema(z.object({
            baseUrl: z.string().describe('The base URL of the website (e.g., https://example.com)'),
            path: z.string().describe('The subpage path (e.g., /pricing, /about)'),
          })),
          execute: async ({ baseUrl, path }: { baseUrl: string; path: string }) => {
            const url = cleanUrl(baseUrl).replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`)
            return scrapeWebpageExecute({ url })
          },
        }),
      },
      stopWhen: stepCountIs(3),
      async onFinish({ text, totalUsage }) {
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
            input: userContent,
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

    const response = result.toUIMessageStreamResponse()

    // Add conversation ID header
    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Conversation-Id', convId!)
    newHeaders.set('Cache-Control', 'no-cache')

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Chat error:', errorMsg)
    await prisma.message.create({
      data: { conversationId: convId!, role: 'ASSISTANT', content: '❌ Something went wrong. Please try again.' },
    })
    return NextResponse.json({ error: 'Chat request failed. Please try again.', conversationId: convId }, { status: 500 })
  }
  } catch (outerErr) {
    console.error('Chat route uncaught error:', outerErr)
    return NextResponse.json({ error: `Unexpected error: ${outerErr instanceof Error ? outerErr.message : String(outerErr)}` }, { status: 500 })
  }
}
