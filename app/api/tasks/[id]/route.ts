import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, isAuthContext } from '@/lib/middleware'
import { updateTaskSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// PATCH /api/tasks/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const body = await req.json()
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const result = await prisma.task.updateMany({
    where: { id: params.id, teamId: ctx.teamId },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    } as any,
  })

  if (result.count === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const updated = await prisma.task.findUnique({ where: { id: params.id } })
  return NextResponse.json(updated)
}

// DELETE /api/tasks/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  const result = await prisma.task.deleteMany({
    where: { id: params.id, teamId: ctx.teamId },
  })

  if (result.count === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
