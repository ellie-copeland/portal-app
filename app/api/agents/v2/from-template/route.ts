import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST /api/agents/v2/from-template — Create agent from template
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const { templateId, name, templateData } = await req.json()

  if (!templateId && !templateData) {
    return NextResponse.json({ error: 'templateId or templateData is required' }, { status: 400 })
  }

  // Try DB template first
  let templateInfo: any = null
  if (templateId) {
    templateInfo = await prisma.agentTemplate.findUnique({ where: { id: templateId } })
  }

  // Fall back to inline template data (for default/client-side templates)
  if (!templateInfo && templateData) {
    templateInfo = {
      name: templateData.name || 'AI Agent',
      description: templateData.description || '',
      model: templateData.model || 'gpt-4o-mini',
      systemPrompt: templateData.systemPrompt || `You are a ${templateData.role || 'helpful assistant'}.`,
      constraints: templateData.constraints || [],
      role: templateData.role || 'assistant',
      config: {},
    }
  }

  if (!templateInfo) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const agent = await prisma.agent.create({
    data: {
      teamId: ctx.teamId,
      createdById: ctx.userId,
      name: name || templateInfo.name,
      description: templateInfo.description,
      model: templateInfo.model,
      systemPrompt: templateInfo.systemPrompt,
      constraints: templateInfo.constraints,
      role: templateInfo.role,
      config: (templateInfo.config as any) || {},
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      teamId: ctx.teamId,
      action: 'agent.create_from_template',
      resource: 'agent',
      resourceId: agent.id,
      details: { templateId, templateName: templateInfo.name },
    },
  })

  return NextResponse.json(agent, { status: 201 })
}
