import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!isAuthContext(ctx)) return ctx

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert file to base64 data URL
    // This works on Vercel (read-only filesystem) and locally
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = Buffer.from(binary, 'binary').toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
