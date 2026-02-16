import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isAuthContext } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// Proxy requests to external APIs using user-provided tokens
// This avoids CORS issues and keeps tokens server-side
export async function POST(req: NextRequest) {
  // Auth is optional for this endpoint - tokens are user-provided
  // const ctx = await getAuthContext(req)
  // if (!isAuthContext(ctx)) return ctx

  try {
    const { provider, token, action } = await req.json()

    if (!provider || !token) {
      return NextResponse.json({ error: 'provider and token required' }, { status: 400 })
    }

    switch (provider) {
      case 'vercel': {
        if (action === 'projects') {
          const res = await fetch('https://api.vercel.com/v9/projects?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ error: `Vercel API error: ${res.status}`, details: err }, { status: res.status })
          }
          const data = await res.json()
          const projects = (data.projects || []).map((p: any) => ({
            label: p.name,
            value: p.id,
            url: `https://${p.name}.vercel.app`,
            framework: p.framework,
            updatedAt: p.updatedAt,
          }))
          return NextResponse.json({ options: projects })
        }
        break
      }

      case 'github': {
        if (action === 'repos') {
          const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          })
          if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ error: `GitHub API error: ${res.status}`, details: err }, { status: res.status })
          }
          const repos = await res.json()
          const options = repos.map((r: any) => ({
            label: r.full_name,
            value: r.full_name,
            url: r.html_url,
            private: r.private,
            language: r.language,
          }))
          return NextResponse.json({ options })
        }
        break
      }

      case 'sentry': {
        if (action === 'projects') {
          const res = await fetch('https://sentry.io/api/0/projects/', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            return NextResponse.json({ error: `Sentry API error: ${res.status}` }, { status: res.status })
          }
          const projects = await res.json()
          const options = projects.map((p: any) => ({
            label: `${p.organization.slug}/${p.slug}`,
            value: p.id,
          }))
          return NextResponse.json({ options })
        }
        break
      }

      default:
        return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Integration proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
