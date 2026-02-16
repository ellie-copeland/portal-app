import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Disable body parsing — Stripe needs the raw body
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout completed:', session.id, 'customer:', session.customer)
        // TODO: Update team subscription status in DB
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice paid:', invoice.id, 'customer:', invoice.customer)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', sub.id, 'status:', sub.status)
        // TODO: Update subscription status in DB
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        console.log('Subscription canceled:', sub.id)
        // TODO: Downgrade team to free tier in DB
        break
      }
      default:
        console.log('Unhandled webhook event:', event.type)
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
