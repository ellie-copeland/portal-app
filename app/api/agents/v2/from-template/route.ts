import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST /api/agents/v2/from-template — Create agent from template
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const { templateId, name } = await req.json()

  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
  }

  const template = await prisma.agentTemplate.findUnique({ where: { id: templateId } })
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const agent = await prisma.agent.create({
    data: {
      teamId: ctx.teamId,
      createdById: ctx.userId,
      name: name || template.name,
      description: template.description,
      model: template.model,
      systemPrompt: template.systemPrompt,
      constraints: template.constraints,
      role: template.role,
      config: template.config as any,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      teamId: ctx.teamId,
      action: 'agent.create_from_template',
      resource: 'agent',
      resourceId: agent.id,
      details: { templateId, templateName: template.name },
    },
  })

  return NextResponse.json(agent, { status: 201 })
}
