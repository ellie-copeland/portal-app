import { NextRequest, NextResponse } from 'next/server'
import { stripe, ensurePrices, TIERS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { lookup, email, teamId } = await req.json()

    if (!lookup || !TIERS.find(t => t.lookup === lookup)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const prices = await ensurePrices()
    const priceId = prices[lookup]

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${req.nextUrl.origin}/billing?success=1`,
      cancel_url: `${req.nextUrl.origin}/billing?canceled=1`,
      metadata: { teamId: teamId || '' },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
