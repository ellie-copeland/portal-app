# Integration Layer

The integration layer provides a unified interface for AI agents to interact with 10 external platforms:
- **Communication**: Slack, WhatsApp, Telegram, Gmail
- **Development**: GitHub, Sentry, Vercel, Linear
- **Productivity**: Notion
- **CRM**: HubSpot

## Architecture

```
Agent Request
    ↓
IntegrationService
    ↓
ProviderClient (extends BaseIntegrationClient)
    ↓
External API (Slack, GitHub, etc.)
```

## Quick Start

### Execute an Integration Action

```typescript
import { IntegrationService } from '@/lib/integrations'

const result = await IntegrationService.execute(
  'team_123', // Team ID
  'slack',    // Provider
  {
    action: 'send_message',
    payload: {
      channel: '#alerts',
      text: 'Important notification',
    },
  }
)

if (result.success) {
  console.log('Message sent:', result.data)
} else {
  console.error('Error:', result.error)
}
```

### With Approval Gating

```typescript
const result = await IntegrationService.execute(
  teamId,
  'slack',
  {
    action: 'send_message',
    payload: { channel: '#alerts', text: 'Message' },
  },
  true // requireApproval
)

if (result.data?.status === 'PENDING_APPROVAL') {
  // Wait for human approval
  const supervisedActionId = result.data.supervisedActionId
  
  // After approval, execute:
  const finalResult = await IntegrationService.executeApproved(
    teamId,
    'slack',
    supervisedActionId,
    { action: 'send_message', payload: {...} }
  )
}
```

### Test Integration

```typescript
const isConnected = await IntegrationService.test('team_123', 'slack')
```

### Validate Configuration

```typescript
const isValid = await IntegrationService.validateConfig('slack', {
  bot_token: 'xoxb-...',
})
```

## Providers

### Slack
**Actions**: send_message, get_channels, get_users, post_thread, react_to_message

```typescript
{
  provider: 'slack',
  action: 'send_message',
  payload: {
    channel: '#general',
    text: 'Hello!',
    blocks: [...] // Optional rich formatting
  }
}
```

### GitHub
**Actions**: create_issue, create_pr_comment, list_prs, list_issues, update_pr

```typescript
{
  provider: 'github',
  action: 'create_issue',
  payload: {
    owner: 'myorg',
    repo: 'myrepo',
    title: 'Bug: Something broken',
    body: 'Description...',
    labels: ['bug', 'critical']
  }
}
```

### Sentry
**Actions**: get_issues, get_issue_details, mark_issue_resolved

```typescript
{
  provider: 'sentry',
  action: 'get_issues',
  payload: {
    project: 'myproject',
    limit: 50
  }
}
```

### Linear
**Actions**: create_issue, update_issue, list_issues, add_comment

```typescript
{
  provider: 'linear',
  action: 'create_issue',
  payload: {
    teamId: 'team_123',
    title: 'Implement feature X',
    description: 'Details...',
    priority: 1
  }
}
```

### Vercel
**Actions**: get_deployments, get_project, revert_deployment

```typescript
{
  provider: 'vercel',
  action: 'get_deployments',
  payload: {
    projectId: 'proj_123',
    limit: 20
  }
}
```

### Notion
**Actions**: create_page, update_page, query_database, get_page

```typescript
{
  provider: 'notion',
  action: 'create_page',
  payload: {
    parentId: 'database_123',
    title: 'Meeting Notes',
    content: 'Notes from today...'
  }
}
```

### Gmail
**Actions**: draft_reply, list_threads, get_message, send_reply

```typescript
{
  provider: 'gmail',
  action: 'draft_reply',
  payload: {
    threadId: 'thread_123',
    body: 'Thanks for reaching out!'
  }
}
```

### HubSpot
**Actions**: create_contact, update_contact, get_contact, create_deal, update_deal

```typescript
{
  provider: 'hubspot',
  action: 'create_contact',
  payload: {
    email: 'john@example.com',
    firstname: 'John',
    lastname: 'Doe',
    phone: '+1234567890'
  }
}
```

### WhatsApp
**Actions**: send_message, get_messages

```typescript
{
  provider: 'whatsapp',
  action: 'send_message',
  payload: {
    to: '+1234567890',
    body: 'Hello!'
  }
}
```

### Telegram
**Actions**: send_message, get_updates

```typescript
{
  provider: 'telegram',
  action: 'send_message',
  payload: {
    chatId: '123456789',
    text: 'Hello!'
  }
}
```

## Creating a New Provider

1. **Create client file**: `lib/integrations/clients/myprovider.ts`

```typescript
import { BaseIntegrationClient } from '../base'
import { IntegrationExecutionRequest, IntegrationExecutionResponse } from '../types'

export class MyProviderClient extends BaseIntegrationClient {
  constructor(encryptedConfig: string) {
    super('myprovider', encryptedConfig)
  }

  async validate(config: Record<string, any>): Promise<boolean> {
    // Validate config format
    return !!config.api_key
  }

  async test(): Promise<boolean> {
    // Test connectivity
    try {
      const config = this.getConfig()
      // Test API call
      return true
    } catch {
      return false
    }
  }

  async execute(request: IntegrationExecutionRequest): Promise<IntegrationExecutionResponse> {
    switch (request.action) {
      case 'my:action':
        return this.myAction(request.payload)
      default:
        return {
          success: false,
          error: `Unsupported action: ${request.action}`,
        }
    }
  }

  private async myAction(payload: Record<string, any>) {
    return this.safeExecute(async () => {
      // Your action implementation
      return { result: 'success' }
    }, 'my_action')
  }
}
```

2. **Register in IntegrationService**: `lib/integrations/service.ts`

```typescript
case 'myprovider':
  return new MyProviderClient(encryptedConfig)
```

3. **Add actions to types**: `lib/integrations/types.ts`

```typescript
enum IntegrationAction {
  // ... existing actions
  MY_ACTION = 'myprovider:my_action',
}
```

## Error Handling

All integrations return standardized responses:

```typescript
{
  success: boolean
  data?: any
  error?: string
  metadata?: {
    executionTime?: number
    provider?: string
    action?: string
  }
}
```

## Rate Limiting

Built-in rate limiting framework (extensible to Redis):

```typescript
const allowed = await provider.checkRateLimit('endpoint:name')
```

## Retry Logic

Automatic retry with exponential backoff:

```typescript
const result = await this.retry(
  () => apiCall(),
  3,        // max attempts
  1000      // initial delay (ms)
)
```

## Configuration

All configuration is encrypted at rest using AES-256-GCM:

```typescript
const encrypted = encrypt(JSON.stringify({ api_key: 'secret' }))
// Store in database
// Decrypt when needed with decrypt(encrypted)
```

## Testing

```bash
# Test single integration
POST /api/agents/v2/[agentId]/execute
{
  "provider": "slack",
  "action": "send_message",
  "payload": {"channel": "#test", "text": "Test"}
}

# Test all integrations
POST /api/integrations/test-all
```

## Security

- **Token Storage**: Encrypted in database
- **Approval Gating**: High-risk actions require approval
- **Audit Logging**: All executions logged
- **Rate Limiting**: Built-in protection against abuse
- **CSRF Protection**: All state-changing requests validated

## Performance

- **Client Instantiation**: On-demand (stateless)
- **Config Decryption**: Lazy (only when needed)
- **Caching**: None by default (can be added per provider)
- **Timeout**: 30 seconds per request

## Troubleshooting

### Integration Test Fails
1. Check token is valid and not expired
2. Verify config is correctly encrypted
3. Check provider scopes/permissions
4. Look at execution logs in database

### Action Returns Error
1. Verify payload format
2. Check required fields in payload
3. Look at API response details in error message
4. Check rate limits

### Approval Gating Not Working
1. Check SupervisedAction status
2. Verify supervisedActionId in approval request
3. Check agent is ACTIVE
4. Review execution logs

## Contributing

When adding a new provider:
1. Follow BaseIntegrationClient pattern
2. Add comprehensive error handling
3. Implement both test() and validate()
4. Add config encryption support
5. Include rate limit checking
6. Write tests
7. Document all actions

## API Reference

### IntegrationService

- `execute(teamId, provider, request, approvalRequired?)` - Execute action
- `executeApproved(teamId, provider, supervisedActionId, request)` - Execute approved action
- `test(teamId, provider)` - Test connectivity
- `validateConfig(provider, config)` - Validate configuration
- `getClient(provider, encryptedConfig)` - Get client instance

### BaseIntegrationClient

- `getConfig()` - Get decrypted config
- `safeExecute(fn, action?)` - Execute with error handling
- `checkRateLimit(endpoint)` - Check rate limits
- `retry(fn, maxAttempts, delayMs)` - Retry with backoff

## License

Proprietary - All integrations are part of Portal App
