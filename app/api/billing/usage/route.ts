import { NextResponse } from 'next/server'
import { TIERS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Return available tiers (subscription status would come from DB in production)
  const tiers = TIERS.map(t => ({
    lookup: t.lookup,
    name: t.name,
    price: t.price / 100,
  }))

  return NextResponse.json({ tiers })
}
