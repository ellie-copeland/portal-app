import Stripe from 'stripe'

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  })
}

let _stripe: Stripe | null = null
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = getStripe()
    return (_stripe as any)[prop]
  },
})

// Subscription tier definitions
export const TIERS = [
  { name: 'Starter', price: 2900, lookup: 'starter_monthly' },
  { name: 'Pro', price: 7900, lookup: 'pro_monthly' },
  { name: 'Enterprise', price: 19900, lookup: 'enterprise_monthly' },
] as const

// Ensure products + prices exist in Stripe, return price IDs
let cachedPrices: Record<string, string> | null = null

export async function ensurePrices(): Promise<Record<string, string>> {
  if (cachedPrices) return cachedPrices

  const result: Record<string, string> = {}

  for (const tier of TIERS) {
    // Try to find existing price by lookup key
    const existing = await stripe.prices.list({ lookup_keys: [tier.lookup], limit: 1 })
    if (existing.data.length > 0) {
      result[tier.lookup] = existing.data[0].id
      continue
    }

    // Create product + price
    const product = await stripe.products.create({
      name: `Cloud Employee Portal – ${tier.name}`,
      metadata: { tier: tier.lookup },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.price,
      currency: 'usd',
      recurring: { interval: 'month' },
      lookup_key: tier.lookup,
    })

    result[tier.lookup] = price.id
  }

  cachedPrices = result
  return result
}
