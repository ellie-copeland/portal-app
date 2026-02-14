import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// TODO: Migrate to Supabase Storage when available
// Currently returns a placeholder URL — files are not persisted

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

    // TODO: Store file in Supabase Storage and return real URL
    const placeholderUrl = `/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    return NextResponse.json({
      url: placeholderUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      message: 'File upload stubbed — storage not yet configured',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
