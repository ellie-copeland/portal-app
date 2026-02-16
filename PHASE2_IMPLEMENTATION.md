# PHASE 2 IMPLEMENTATION GUIDE

## Overview
This document describes the complete Phase 2 implementation of the Portal App, which includes:
1. **Integration Execution Layer** - SDK clients for 10 providers
2. **Security Deliverables** - Audit logging, CSRF, CSP, alerting, GDPR export
3. **Agent Wiring** - Agents can now execute integrations with approval gating

---

## Part 1: Integration Execution Layer

### Architecture
```
Agent Request
    ↓
/api/agents/v2/[id]/execute
    ↓
IntegrationService.execute()
    ↓
ProviderClient (Slack, GitHub, etc.)
    ↓
External API
```

### Files Created

#### Core Integration System
- **`lib/integrations/types.ts`** - Type definitions and enums
- **`lib/integrations/base.ts`** - Base client abstraction
- **`lib/integrations/service.ts`** - Integration orchestration service
- **`lib/integrations/index.ts`** - Exports

#### Provider Clients (10 total)
- **`lib/integrations/clients/slack.ts`** - Slack (send_message, get_channels, post_thread, react)
- **`lib/integrations/clients/github.ts`** - GitHub (create_issue, pr_comment, list_prs)
- **`lib/integrations/clients/sentry.ts`** - Sentry (get_issues, mark_resolved)
- **`lib/integrations/clients/linear.ts`** - Linear (create_issue, update, list, comment)
- **`lib/integrations/clients/vercel.ts`** - Vercel (get_deployments, revert)
- **`lib/integrations/clients/notion.ts`** - Notion (create_page, update, query_db)
- **`lib/integrations/clients/gmail.ts`** - Gmail (draft_reply, send, list_threads)
- **`lib/integrations/clients/hubspot.ts`** - HubSpot (contacts, deals)
- **`lib/integrations/clients/whatsapp.ts`** - WhatsApp (send_message)
- **`lib/integrations/clients/telegram.ts`** - Telegram (send_message, get_updates)

#### API Endpoints
- **`app/api/integrations/execute/route.ts`** - Main integration execution endpoint
- **`app/api/integrations/test-all/route.ts`** - Test all integrations
- **`app/api/agents/v2/[id]/execute/route.ts`** - Agent execution with integration support

### Usage Example

```typescript
// Agent calls this endpoint
POST /api/agents/v2/[agentId]/execute
{
  "provider": "slack",
  "action": "send_message",
  "payload": {
    "channel": "#general",
    "text": "Hello from AI agent!"
  },
  "approvalRequired": true
}

// Response (if approval required)
{
  "success": false,
  "awaitingApproval": true,
  "supervisedActionId": "sa_123",
  "message": "Action requires approval"
}

// After approval
POST /api/agents/v2/[agentId]/execute
{
  "provider": "slack",
  "action": "send_message",
  "payload": {...},
  "supervisedActionId": "sa_123"
}

// Response
{
  "success": true,
  "executionId": "exec_123",
  "data": {
    "channel": "C123456",
    "ts": "1234567890.123456"
  }
}
```

### Key Features

1. **Abstraction Layer** - Each provider extends `BaseIntegrationClient`
2. **Error Handling** - Automatic retry logic with exponential backoff
3. **Config Encryption** - All tokens stored encrypted in database
4. **Validation** - Each provider validates config before execution
5. **Rate Limiting** - Built-in rate limit checking (extensible to Redis)
6. **Approval Gating** - High-risk actions require approval via `SupervisedAction` model

### Supported Actions by Provider

**Slack**: send_message, get_channels, get_users, post_thread, react_to_message
**GitHub**: create_issue, create_pr_comment, list_prs, list_issues, update_pr
**Sentry**: get_issues, get_issue_details, mark_issue_resolved
**Linear**: create_issue, update_issue, list_issues, add_comment
**Vercel**: get_deployments, get_project, revert_deployment
**Notion**: create_page, update_page, query_database, get_page
**Gmail**: draft_reply, list_threads, get_message, send_reply
**HubSpot**: create_contact, update_contact, get_contact, create_deal, update_deal
**WhatsApp**: send_message, get_messages
**Telegram**: send_message, get_updates

---

## Part 2: Security Deliverables

### 1. Audit Logging System
**File**: `lib/audit.ts`

Features:
- Immutable audit trail for auth, admin, and billing events
- Structured logging with severity levels
- Event filtering and querying
- Log retention policies (optional archiving)

```typescript
// Log an event
await logAuditEvent({
  userId: 'user_123',
  teamId: 'team_456',
  action: AuditAction.INTEGRATION_EXECUTE,
  resource: 'integration',
  resourceId: 'slack/send_message',
  severity: 'low',
  details: {
    provider: 'slack',
    action: 'send_message',
    success: true,
  },
})

// Query logs
const logs = await fetchAuditLogs(teamId, {
  action: 'integration:execute',
  startDate: new Date(Date.now() - 7*24*60*60*1000),
})
```

### 2. Stripe Webhook Completion
**File**: `app/api/webhooks/stripe/route.ts`

Handles all webhook types:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `charge.succeeded` - Payment confirmation
- `charge.failed` - Payment failure
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Invoice failed

All events are logged to audit trail and stored in team metadata.

### 3. CSRF Token Protection
**File**: `lib/csrf.ts`

Features:
- Server-side token generation
- Secure httpOnly cookie storage
- POST/PUT/DELETE/PATCH validation
- Configurable whitelist for public endpoints

```typescript
// Frontend: get fresh token
const res = await fetch('/api/csrf-token')
const { token } = await res.json()

// Frontend: send with request
fetch('/api/some-action', {
  method: 'POST',
  headers: {
    'x-csrf-token': token,
  },
})
```

Validation is automatic via middleware.

### 4. CSP Hardening
**File**: `middleware.ts`

Content Security Policy:
```
default-src 'self'
script-src 'self' 'nonce-{random}' https://cdn.jsdelivr.net
style-src 'self' 'nonce-{random}' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https:
connect-src 'self' https:
frame-ancestors 'none'
form-action 'self'
object-src 'none'
upgrade-insecure-requests
```

Also adds:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy` restrictions

### 5. Security Alerting
**File**: `lib/security-alerts.ts`

Features:
- Create and resolve security alerts
- Slack webhook integration for real-time alerts
- Brute force detection
- Rate limiting helpers
- Unusual activity detection hooks

```typescript
// Create alert
await createSecurityAlert({
  severity: 'CRITICAL',
  title: 'Suspicious Login',
  message: 'Multiple failed login attempts',
  source: 'brute-force-detection',
  teamId: 'team_123',
  metadata: { ip: '203.0.113.0' },
})

// Alerts are sent to Slack + stored in DB
```

### 6. GDPR Data Export
**File**: `app/api/users/me/export/route.ts`

Endpoint: `GET /api/users/me/export`

Exports all user data in portable JSON format:
- User profile
- Team memberships
- Agents created
- Conversations
- Executions
- API keys (metadata only, no actual keys)
- Integrations (metadata only, no credentials)
- Audit logs

Response is sent as downloadable JSON file with timestamp.

---

## Part 3: Integration with Agents

### Agent Execution Flow

1. **Agent initiates action** via `/api/agents/v2/[id]/execute`
2. **Server validates** agent status and team membership
3. **Execution created** in database to track status
4. **IntegrationService** loads appropriate provider client
5. **Action evaluated** - if high-risk, requires approval
6. **SupervisedAction** created for approval workflow
7. **After approval**, execution continues
8. **Result stored** in execution record
9. **Audit log** created for compliance

### High-Risk Actions (Require Approval)

These actions create a `SupervisedAction` record and wait for human approval:
- send_message (all platforms)
- create_issue
- create_pr_comment
- post_thread
- create_page
- send_reply
- create_contact
- create_deal
- update_deal

---

## Part 4: Database Changes

### New/Updated Models

#### Execution (enhanced)
- `metadata.supervisedActionId` - Links to approval record
- `metadata.provider` - Integration provider
- `metadata.action` - Integration action
- `metadata.awaitingApproval` - Approval pending flag

#### AuditLog (enhanced)
- Added severity levels
- Enhanced details field for structured data
- IP tracking for auth events

#### SupervisedAction
- Used for approval gating
- Stores draft and final output
- Tracks approval status and reviewer

#### Alert (enhanced)
- New alerts for security events
- Severity levels: CRITICAL, WARNING, INFO
- Metadata for context

---

## Testing Integration Endpoints

### Test Single Integration
```bash
curl -X POST http://localhost:3000/api/agents/v2/[agentId]/execute \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: [token]" \
  -d '{
    "provider": "slack",
    "action": "send_message",
    "payload": {
      "channel": "#test",
      "text": "Test message"
    },
    "approvalRequired": true
  }'
```

### Test All Integrations
```bash
curl -X POST http://localhost:3000/api/integrations/test-all \
  -H "Authorization: Bearer [token]" \
  -H "x-csrf-token: [token]"
```

### Get CSRF Token
```bash
curl -X GET http://localhost:3000/api/csrf-token
```

### Export User Data
```bash
curl -X GET http://localhost:3000/api/users/me/export \
  -H "Authorization: Bearer [token]" \
  -H "x-csrf-token: [token]"
```

---

## Deployment Checklist

- [ ] Install dependencies: `npm install @slack/web-api @octokit/rest`
- [ ] Set environment variables:
  - `ENCRYPTION_KEY` or `JWT_SECRET` (for token encryption)
  - `SLACK_WEBHOOK_URL` (for security alerts)
  - `STRIPE_SECRET_KEY` (for Stripe webhooks)
  - `STRIPE_WEBHOOK_SECRET` (for webhook validation)
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Test all integrations with `/api/integrations/test-all`
- [ ] Configure Stripe webhook endpoint
- [ ] Update CSP headers in production
- [ ] Enable CSRF validation in production

---

## Performance Considerations

1. **Integration Client Caching** - Clients are instantiated per request (stateless)
2. **Approval Gating** - High-risk actions incur ~50-200ms additional latency for DB lookup
3. **Rate Limiting** - Should migrate to Redis for distributed rate limiting
4. **Audit Logging** - Async logging (doesn't block requests)
5. **Webhook Processing** - Asynchronous, can handle high volume

---

## Future Enhancements

1. **Scheduled Executions** - Run integrations on a schedule
2. **Workflow Builder** - Chain multiple integration actions
3. **Webhook Triggers** - Trigger agents from external events
4. **Bulk Operations** - Execute actions on multiple resources
5. **Custom Integrations** - Allow teams to build custom providers
6. **Integration Templates** - Pre-built workflows for common use cases
7. **Execution Rollback** - Undo integration actions
8. **Advanced Filtering** - More sophisticated approval rules

---

## Troubleshooting

### Integration Test Failures
1. Check token is valid and not expired
2. Verify provider credentials are correctly encrypted
3. Check provider-specific scopes/permissions
4. Look at execution logs in database

### CSRF Validation Errors
1. Ensure CSRF token is included in headers
2. Check token is valid (hasn't expired)
3. Verify cookie is being set correctly
4. Clear browser cookies and retry

### Approval Not Working
1. Check `SupervisedAction` status in database
2. Verify `supervisedActionId` is included in approval request
3. Check agent status is not INACTIVE
4. Look at execution logs for details

---

## Code Examples

### Slack Integration (Agent Perspective)

```typescript
// In agent code
const response = await fetch('/api/agents/v2/my-agent-id/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  },
  body: JSON.stringify({
    provider: 'slack',
    action: 'send_message',
    payload: {
      channel: '#alerts',
      text: '🚨 Critical error detected in production',
    },
  }),
})

const result = await response.json()

if (result.awaitingApproval) {
  // Wait for human approval
  const supervisedActionId = result.supervisedActionId
  // ... poll or webhook for approval status
}
```

### GitHub Integration (Code Review)

```typescript
const response = await fetch('/api/agents/v2/code-reviewer-id/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  },
  body: JSON.stringify({
    provider: 'github',
    action: 'create_pr_comment',
    payload: {
      owner: 'myorg',
      repo: 'myrepo',
      pull_number: 42,
      body: 'This change looks good! ✅',
    },
  }),
})
```

---

## Support

For issues or questions, check:
1. Audit logs for error details
2. Execution logs in database
3. Provider-specific documentation (Slack, GitHub, etc.)
4. Integration test endpoint for connectivity
