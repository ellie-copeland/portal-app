# Phase 2 Dependencies

## New npm Packages Required

Add these packages to your `package.json`:

```json
{
  "dependencies": {
    "@slack/web-api": "^6.9.0",
    "@octokit/rest": "^20.0.0",
    "stripe": "^14.0.0"
  }
}
```

## Installation

```bash
npm install @slack/web-api @octokit/rest stripe
```

## Existing Dependencies Used

The following packages are already listed and are required:
- `@prisma/client` - Database
- `next` - Framework
- `crypto` - Node.js built-in (CSRF, encryption)

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Encryption
ENCRYPTION_KEY=your-encryption-key-here

# Stripe (for webhooks)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Optional: Redis (for production rate limiting)

For distributed rate limiting and caching:

```bash
npm install redis ioredis
```

Add to `.env.local`:
```bash
REDIS_URL=redis://localhost:6379
```

## Database Migrations

No new migrations needed - all models already exist in schema.prisma:
- `Integration` - Already supports encrypted config
- `Execution` - Already tracks integration executions
- `AuditLog` - Already logs all events
- `SupervisedAction` - Already handles approval gating
- `Alert` - Already stores security alerts

## Verification

After installing dependencies, verify integration setup:

```bash
# Test endpoint availability
curl -X POST http://localhost:3000/api/integrations/test-all

# Check types compile
npx tsc --noEmit

# Run tests
npm test
```

## Notes

- All SDK packages are for external service integration
- No major version conflicts with existing packages
- These are production-ready stable versions
- All packages have TypeScript support
