import { decrypt } from './crypto'
import { prisma } from './db'

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMRequest {
  model: string
  messages: LLMMessage[]
  systemPrompt?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface LLMResponse {
  content: string
  tokensUsed: number
  promptTokens: number
  completionTokens: number
  cost: number
  model: string
}

// Map model names to providers
function getProvider(model: string): 'openrouter' | 'anthropic' | 'openai' {
  if (model.startsWith('claude') || model.startsWith('anthropic/')) return 'anthropic'
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('openai/')) return 'openai'
  return 'openrouter' // default — OpenRouter supports everything
}

function getEndpoint(provider: string): string {
  switch (provider) {
    case 'anthropic': return 'https://api.anthropic.com/v1/messages'
    case 'openai': return 'https://api.openai.com/v1/chat/completions'
    default: return 'https://openrouter.ai/api/v1/chat/completions'
  }
}

// Clean model name for direct APIs (remove provider prefix)
function cleanModel(model: string): string {
  return model.replace(/^(anthropic|openai|openrouter)\//, '')
}

export async function getUserApiKey(userId: string, provider: string): Promise<string | null> {
  // Try exact provider first, then fallback to openrouter
  const key = await prisma.userApiKey.findFirst({
    where: { userId, provider },
  }) || (provider !== 'openrouter' ? await prisma.userApiKey.findFirst({
    where: { userId, provider: 'openrouter' },
  }) : null)

  if (!key) return null

  // Update lastUsed
  await prisma.userApiKey.update({
    where: { id: key.id },
    data: { lastUsed: new Date() },
  }).catch(() => {}) // non-critical

  return decrypt(key.encryptedKey)
}

function buildAnthropicRequest(req: LLMRequest) {
  const messages = req.messages.filter(m => m.role !== 'system')
  return {
    url: 'https://api.anthropic.com/v1/messages',
    body: {
      model: cleanModel(req.model),
      max_tokens: req.max_tokens || 4096,
      temperature: req.temperature ?? 0.7,
      ...(req.systemPrompt && { system: req.systemPrompt }),
      messages,
      ...(req.stream && { stream: true }),
    },
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
  }
}

function buildOpenAIRequest(req: LLMRequest) {
  const messages: LLMMessage[] = []
  if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt })
  messages.push(...req.messages.filter(m => m.role !== 'system'))
  
  const provider = getProvider(req.model)
  return {
    url: getEndpoint(provider),
    body: {
      model: provider === 'openrouter' ? req.model : cleanModel(req.model),
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens || 4096,
      ...(req.stream && { stream: true }),
    },
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' && { 'HTTP-Referer': 'https://portal-app-gamma.vercel.app' }),
    }),
  }
}

function buildRequest(req: LLMRequest) {
  const provider = getProvider(req.model)
  if (provider === 'anthropic') return buildAnthropicRequest(req)
  return buildOpenAIRequest(req)
}

function parseAnthropicResponse(data: Record<string, unknown>): LLMResponse {
  const content = (data.content as Array<{text: string}>)?.[0]?.text || ''
  const usage = data.usage as { input_tokens?: number; output_tokens?: number } | undefined
  const inputTokens = usage?.input_tokens || 0
  const outputTokens = usage?.output_tokens || 0
  return {
    content,
    tokensUsed: inputTokens + outputTokens,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    cost: estimateCost(data.model as string, inputTokens, outputTokens),
    model: data.model as string,
  }
}

function parseOpenAIResponse(data: Record<string, unknown>): LLMResponse {
  const choices = data.choices as Array<{message: {content: string}}>
  const content = choices?.[0]?.message?.content || ''
  const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
  const promptTokens = usage?.prompt_tokens || 0
  const completionTokens = usage?.completion_tokens || 0
  return {
    content,
    tokensUsed: promptTokens + completionTokens,
    promptTokens,
    completionTokens,
    cost: estimateCost(data.model as string, promptTokens, completionTokens),
    model: data.model as string,
  }
}

// Rough cost estimates per 1M tokens
function estimateCost(model: string, input: number, output: number): number {
  const rates: Record<string, [number, number]> = {
    'gpt-4': [30, 60],
    'gpt-4o': [2.5, 10],
    'gpt-4o-mini': [0.15, 0.6],
    'claude-3-5-sonnet': [3, 15],
    'claude-3-haiku': [0.25, 1.25],
    'claude-sonnet-4': [3, 15],
    'claude-haiku-4': [0.8, 4],
  }
  const key = Object.keys(rates).find(k => model.includes(k))
  const [inRate, outRate] = key ? rates[key] : [5, 15]
  return (input * inRate + output * outRate) / 1_000_000
}

export async function callLLM(req: LLMRequest, apiKey: string): Promise<LLMResponse> {
  const { url, body, headers } = buildRequest({ ...req, stream: false })
  
  const response = await fetch(url, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API error (${response.status}): ${error}`)
  }

  const data = await response.json()
  const provider = getProvider(req.model)
  return provider === 'anthropic' ? parseAnthropicResponse(data) : parseOpenAIResponse(data)
}

export function streamLLM(req: LLMRequest, apiKey: string): ReadableStream<Uint8Array> {
  const { url, body, headers } = buildRequest({ ...req, stream: true })
  const provider = getProvider(req.model)
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const error = await response.text()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `LLM error: ${error}` })}\n\n`))
          controller.close()
          return
        }

        const reader = response.body?.getReader()
        if (!reader) { controller.close(); return }

        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''
        let totalPrompt = 0
        let totalCompletion = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              let chunk = ''

              if (provider === 'anthropic') {
                if (parsed.type === 'content_block_delta') {
                  chunk = parsed.delta?.text || ''
                } else if (parsed.type === 'message_delta') {
                  totalCompletion = parsed.usage?.output_tokens || totalCompletion
                } else if (parsed.type === 'message_start') {
                  totalPrompt = parsed.message?.usage?.input_tokens || 0
                }
              } else {
                chunk = parsed.choices?.[0]?.delta?.content || ''
                if (parsed.usage) {
                  totalPrompt = parsed.usage.prompt_tokens || totalPrompt
                  totalCompletion = parsed.usage.completion_tokens || totalCompletion
                }
              }

              if (chunk) {
                fullContent += chunk
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk, content: fullContent })}\n\n`))
              }
            } catch { /* skip unparseable */ }
          }
        }

        // Send final message with complete content and usage
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          content: fullContent,
          tokensUsed: totalPrompt + totalCompletion,
          promptTokens: totalPrompt,
          completionTokens: totalCompletion,
          cost: estimateCost(req.model, totalPrompt, totalCompletion),
        })}\n\n`))
        controller.close()
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
        controller.close()
      }
    },
  })
}
