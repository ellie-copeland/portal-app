import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { createTaskSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/tasks
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const status = req.nextUrl.searchParams.get('status')
  const agentId = req.nextUrl.searchParams.get('agentId')

  const tasks = await prisma.task.findMany({
    where: {
      teamId: ctx.teamId,
      ...(status && { status: status as any }),
      ...(agentId && { agentId }),
    },
    include: { agent: { select: { id: true, name: true } } },
    orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ tasks })
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      teamId: ctx.teamId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  })

  return NextResponse.json(task, { status: 201 })
}
