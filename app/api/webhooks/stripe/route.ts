/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler
 * Handles subscription, payment, and customer events
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { logBillingEvent } from '@/lib/audit'
import { createSecurityAlert } from '@/lib/security-alerts'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const stripeMetadata = subscription.metadata || {}

    // Update or create team billing record
    const teamId = stripeMetadata.teamId

    if (teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          metadata: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            planId: subscription.items.data[0]?.price?.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        },
      })

      await logBillingEvent(teamId, 'billing:subscription_created', {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
      })
    }

    console.log(`Subscription created: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const teamId = subscription.metadata?.teamId

    if (teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          metadata: {
            subscriptionStatus: subscription.status,
            planId: subscription.items.data[0]?.price?.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        },
      })

      await logBillingEvent(teamId, 'billing:subscription_updated', {
        subscriptionId: subscription.id,
        status: subscription.status,
      })
    }

    console.log(`Subscription updated: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription update:', error)
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const teamId = subscription.metadata?.teamId

    if (teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          metadata: {
            subscriptionStatus: 'canceled',
          },
        },
      })

      await logBillingEvent(teamId, 'billing:subscription_deleted', {
        subscriptionId: subscription.id,
      })
    }

    console.log(`Subscription deleted: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

/**
 * Handle successful charge
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
  try {
    const customerId = charge.customer as string
    const teamId = charge.metadata?.teamId

    if (teamId) {
      await logBillingEvent(teamId, 'billing:payment_succeeded', {
        chargeId: charge.id,
        amount: charge.amount / 100, // Convert from cents
        currency: charge.currency,
      })
    }

    console.log(`Charge succeeded: ${charge.id}`)
  } catch (error) {
    console.error('Error handling charge success:', error)
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(charge: Stripe.Charge) {
  try {
    const teamId = charge.metadata?.teamId

    if (teamId) {
      await logBillingEvent(teamId, 'billing:payment_failed', {
        chargeId: charge.id,
        amount: charge.amount / 100,
        error: charge.failure_message,
      })

      // Create security alert for payment failure
      await createSecurityAlert({
        severity: 'WARNING',
        title: 'Payment Failed',
        message: `Payment failed for team: ${charge.failure_message}`,
        source: 'stripe',
        teamId,
        metadata: {
          chargeId: charge.id,
          amount: charge.amount / 100,
          error: charge.failure_message,
        },
      })
    }

    console.log(`Charge failed: ${charge.id}`)
  } catch (error) {
    console.error('Error handling charge failure:', error)
  }
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const teamId = invoice.metadata?.teamId

    if (teamId) {
      await logBillingEvent(teamId, 'billing:invoice_paid', {
        invoiceId: invoice.id,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
      })
    }

    console.log(`Invoice payment succeeded: ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice payment success:', error)
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const teamId = invoice.metadata?.teamId

    if (teamId) {
      await logBillingEvent(teamId, 'billing:invoice_failed', {
        invoiceId: invoice.id,
        amount: (invoice.amount_due || 0) / 100,
      })

      await createSecurityAlert({
        severity: 'WARNING',
        title: 'Invoice Payment Failed',
        message: `Invoice payment failed for team`,
        source: 'stripe',
        teamId,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amount_due,
        },
      })
    }

    console.log(`Invoice payment failed: ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice payment failure:', error)
  }
}
