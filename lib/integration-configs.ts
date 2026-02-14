// Integration configs for wizard flows
export interface WizardStep {
  title: string
  description: string
  fields: WizardField[]
  help?: string
  links?: { label: string; url: string }[]
}

export interface WizardField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  validation?: (value: any) => string | null
}

export interface IntegrationConfig {
  id: string
  name: string
  icon: string
  description: string
  category: 'communication' | 'development' | 'crm' | 'monitoring' | 'productivity'
  type: 'oauth' | 'token' | 'bot-token'
  steps: WizardStep[]
  testEndpoint?: (credentials: Record<string, any>) => Promise<boolean>
}

// OAUTH-BASED INTEGRATIONS

export const SLACK_CONFIG: IntegrationConfig = {
  id: 'slack',
  name: 'Slack',
  icon: '💬',
  description: 'Monitor channels, respond to mentions, and send proactive alerts',
  category: 'communication',
  type: 'oauth',
  steps: [
    {
      title: 'Slack Permissions',
      description: 'We need permission to monitor channels and send messages',
      fields: [
        {
          name: 'permissions',
          label: 'Required Permissions',
          type: 'checkbox',
          required: true,
          options: [
            { label: 'Read messages', value: 'read' },
            { label: 'Send messages', value: 'send' },
            { label: 'View channel info', value: 'channels' },
          ],
        },
      ],
      help: 'These permissions allow your AI employees to monitor conversations and respond to mentions.',
      links: [
        { label: 'Create a Slack App', url: 'https://api.slack.com/apps' },
      ],
    },
    {
      title: 'Connect with Slack',
      description: 'Click below to authorize the app',
      fields: [
        {
          name: 'oauth_action',
          label: 'Action',
          type: 'select',
          required: true,
          options: [
            { label: 'Add to Slack', value: 'add' },
          ],
        },
      ],
      help: 'You\'ll be redirected to Slack to approve the connection. NOTE: Requires OAuth app configuration at https://api.slack.com/apps',
    },
    {
      title: 'Select Channels',
      description: 'Choose which channels to monitor',
      fields: [
        {
          name: 'channels',
          label: 'Channels to Monitor',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one channel',
        },
      ],
      help: 'Your AI employees will monitor these channels for mentions and keywords.',
    },
  ],
}

export const GITHUB_CONFIG: IntegrationConfig = {
  id: 'github',
  name: 'GitHub',
  icon: '🐙',
  description: 'Review PRs, monitor commits, track issues, and automate workflows',
  category: 'development',
  type: 'oauth',
  steps: [
    {
      title: 'GitHub Permissions',
      description: 'Select the permissions needed for your use case',
      fields: [
        {
          name: 'permissions',
          label: 'Scopes',
          type: 'checkbox',
          required: true,
          options: [
            { label: 'Read repositories', value: 'repo:read' },
            { label: 'Manage pull requests', value: 'pr:manage' },
            { label: 'Read issues', value: 'issues:read' },
          ],
        },
      ],
      help: 'Permissions control what your AI can access and do in your repositories.',
      links: [
        { label: 'Create OAuth App', url: 'https://github.com/settings/developers' },
      ],
    },
    {
      title: 'Connect with GitHub',
      description: 'Authorize the connection',
      fields: [
        {
          name: 'oauth_action',
          label: 'Action',
          type: 'select',
          required: true,
          options: [
            { label: 'Connect with GitHub', value: 'connect' },
          ],
        },
      ],
      help: 'You\'ll be redirected to GitHub to authorize. NOTE: Requires OAuth app configuration at https://github.com/settings/developers',
    },
    {
      title: 'Select Repositories',
      description: 'Choose which repositories to monitor',
      fields: [
        {
          name: 'repos',
          label: 'Repositories',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one repository',
        },
      ],
      help: 'Your AI will monitor PRs, issues, and commits in selected repositories.',
    },
  ],
}

export const HUBSPOT_CONFIG: IntegrationConfig = {
  id: 'hubspot',
  name: 'HubSpot',
  icon: '🔶',
  description: 'Auto-log calls, update deal stages, and track customer interactions',
  category: 'crm',
  type: 'oauth',
  steps: [
    {
      title: 'HubSpot Account',
      description: 'We need access to your HubSpot workspace',
      fields: [
        {
          name: 'account',
          label: 'Account Info',
          type: 'text',
          placeholder: 'Your HubSpot account will be linked',
        },
      ],
      help: 'HubSpot integrations are auto-configured once authorized.',
      links: [
        { label: 'Create Private App', url: 'https://app.hubspot.com/l/private-apps' },
      ],
    },
    {
      title: 'Connect with HubSpot',
      description: 'Click to authorize your HubSpot workspace',
      fields: [
        {
          name: 'oauth_action',
          label: 'Action',
          type: 'select',
          required: true,
          options: [
            { label: 'Connect with HubSpot', value: 'connect' },
          ],
        },
      ],
      help: 'NOTE: Requires OAuth app configuration. HubSpot will auto-configure available features.',
    },
  ],
}

export const GMAIL_CONFIG: IntegrationConfig = {
  id: 'gmail',
  name: 'Gmail',
  icon: '📧',
  description: 'Monitor inboxes, draft responses, and flag urgent emails',
  category: 'communication',
  type: 'oauth',
  steps: [
    {
      title: 'Gmail Scopes',
      description: 'Select which permissions your AI needs',
      fields: [
        {
          name: 'scopes',
          label: 'Email Permissions',
          type: 'checkbox',
          required: true,
          options: [
            { label: 'Read emails', value: 'read' },
            { label: 'Send emails', value: 'send' },
            { label: 'Modify labels', value: 'labels' },
          ],
        },
      ],
      help: 'More permissions allow your AI to draft responses and organize messages.',
      links: [
        { label: 'Create OAuth 2.0 Credentials', url: 'https://myaccount.google.com/security' },
      ],
    },
    {
      title: 'Connect with Google',
      description: 'Authorize Gmail access',
      fields: [
        {
          name: 'oauth_action',
          label: 'Action',
          type: 'select',
          required: true,
          options: [
            { label: 'Connect with Google', value: 'connect' },
          ],
        },
      ],
      help: 'NOTE: Requires OAuth app configuration. You\'ll be redirected to Google to authorize.',
    },
  ],
}

// TOKEN/KEY-BASED INTEGRATIONS

export const SENTRY_CONFIG: IntegrationConfig = {
  id: 'sentry',
  name: 'Sentry',
  icon: '🛡️',
  description: 'Monitor errors, correlate with deployments, and alert on-call engineers',
  category: 'monitoring',
  type: 'token',
  steps: [
    {
      title: 'Sentry Auth Token',
      description: 'Paste your Sentry authentication token',
      fields: [
        {
          name: 'token',
          label: 'Auth Token',
          type: 'textarea',
          placeholder: 'Paste your token here',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            if (value.trim().length < 10) return 'Token seems too short'
            return null
          },
        },
      ],
      help: 'Find your auth token in Sentry account settings. This allows us to access your error data.',
      links: [
        { label: 'Get Auth Token', url: 'https://sentry.io/settings/account/api/auth-tokens/' },
      ],
    },
    {
      title: 'Select Organization & Projects',
      description: 'Choose which projects to monitor',
      fields: [
        {
          name: 'organization',
          label: 'Organization',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an organization',
        },
        {
          name: 'projects',
          label: 'Projects to Monitor',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one project',
        },
      ],
      help: 'Your AI will monitor errors and issues in selected projects.',
    },
  ],
}

export const LINEAR_CONFIG: IntegrationConfig = {
  id: 'linear',
  name: 'Linear',
  icon: '📋',
  description: 'Track issues, create tickets from alerts, and sync project status',
  category: 'productivity',
  type: 'token',
  steps: [
    {
      title: 'Linear API Key',
      description: 'Paste your Linear API key',
      fields: [
        {
          name: 'token',
          label: 'API Key',
          type: 'textarea',
          placeholder: 'Paste your API key here',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'API key is required'
            if (value.trim().length < 10) return 'API key seems too short'
            return null
          },
        },
      ],
      help: 'Get your API key from Linear settings. This allows us to create and update issues.',
      links: [
        { label: 'Get API Key', url: 'https://linear.app/settings/api' },
      ],
    },
    {
      title: 'Select Team & Projects',
      description: 'Choose which teams and projects to manage',
      fields: [
        {
          name: 'team',
          label: 'Team',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select a team',
        },
        {
          name: 'projects',
          label: 'Projects',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one project',
        },
      ],
      help: 'Your AI will be able to create and update issues in selected projects.',
    },
  ],
}

export const VERCEL_CONFIG: IntegrationConfig = {
  id: 'vercel',
  name: 'Vercel',
  icon: '▲',
  description: 'Monitor deployments, track build status, and correlate with errors',
  category: 'development',
  type: 'token',
  steps: [
    {
      title: 'Vercel Access Token',
      description: 'Paste your Vercel access token',
      fields: [
        {
          name: 'token',
          label: 'Access Token',
          type: 'textarea',
          placeholder: 'Paste your token here',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            if (value.trim().length < 10) return 'Token seems too short'
            return null
          },
        },
      ],
      help: 'Get your access token from Vercel dashboard. This allows us to monitor deployments.',
      links: [
        { label: 'Get Access Token', url: 'https://vercel.com/account/tokens' },
      ],
    },
    {
      title: 'Select Projects',
      description: 'Choose which projects to monitor',
      fields: [
        {
          name: 'projects',
          label: 'Projects to Monitor',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one project',
        },
      ],
      help: 'Your AI will monitor deployment status and build logs for selected projects.',
    },
  ],
}

export const NOTION_CONFIG: IntegrationConfig = {
  id: 'notion',
  name: 'Notion',
  icon: '📝',
  description: 'Sync knowledge base, create pages from conversations, and track docs',
  category: 'productivity',
  type: 'token',
  steps: [
    {
      title: 'Create Notion Integration',
      description: 'Create an internal integration in your Notion workspace',
      fields: [
        {
          name: 'setup',
          label: 'Setup Instructions',
          type: 'text',
          placeholder: 'Follow the link to create an internal integration',
        },
      ],
      help: 'Visit Notion integrations page and create a new internal integration. You\'ll get a token.',
      links: [
        { label: 'Create Integration', url: 'https://www.notion.so/my-integrations' },
      ],
    },
    {
      title: 'Paste Integration Token',
      description: 'Enter your Notion internal integration token',
      fields: [
        {
          name: 'token',
          label: 'Integration Token',
          type: 'textarea',
          placeholder: 'Paste your Notion integration token',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            if (!value.trim().startsWith('secret_')) return 'Token should start with "secret_"'
            return null
          },
        },
      ],
      help: 'Your Notion integration token allows us to read and create pages.',
    },
  ],
}

// BOT TOKEN-BASED INTEGRATIONS

export const WHATSAPP_CONFIG: IntegrationConfig = {
  id: 'whatsapp',
  name: 'WhatsApp',
  icon: '📱',
  description: 'Chat with AI employees directly via WhatsApp Business',
  category: 'communication',
  type: 'bot-token',
  steps: [
    {
      title: 'WhatsApp Business Setup',
      description: 'Set up WhatsApp Business API access',
      fields: [
        {
          name: 'guide',
          label: 'Setup Guide',
          type: 'text',
          placeholder: 'Follow the setup guide to get your business account',
        },
      ],
      help: 'You need a WhatsApp Business API account. Click below for setup details.',
      links: [
        { label: 'WhatsApp Business API', url: 'https://www.whatsapp.com/business/api' },
      ],
    },
    {
      title: 'WhatsApp Credentials',
      description: 'Enter your WhatsApp Business API credentials',
      fields: [
        {
          name: 'phone_id',
          label: 'Phone Number ID',
          type: 'text',
          placeholder: 'Your phone number ID',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Phone ID is required'
            if (!/^\d+$/.test(value)) return 'Phone ID should contain only numbers'
            return null
          },
        },
        {
          name: 'access_token',
          label: 'Access Token',
          type: 'textarea',
          placeholder: 'Your WhatsApp Business API access token',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Access token is required'
            return null
          },
        },
      ],
      help: 'Find these in your WhatsApp Business App settings under API Setup.',
    },
    {
      title: 'Webhook Configuration',
      description: 'Configure WhatsApp to send messages to your AI',
      fields: [
        {
          name: 'webhook_url',
          label: 'Webhook URL',
          type: 'text',
          placeholder: '',
        },
      ],
      help: 'Copy this URL and paste it in WhatsApp Business settings > Webhooks > Callback URL',
    },
  ],
}

export const TELEGRAM_CONFIG: IntegrationConfig = {
  id: 'telegram',
  name: 'Telegram',
  icon: '✈️',
  description: 'Receive alerts and chat with agents via Telegram bot',
  category: 'communication',
  type: 'bot-token',
  steps: [
    {
      title: 'Create Telegram Bot',
      description: 'Create a bot using BotFather',
      fields: [
        {
          name: 'guide',
          label: 'Instructions',
          type: 'text',
          placeholder: 'Message @BotFather on Telegram to create a new bot',
        },
      ],
      help: 'Open Telegram and chat with @BotFather to create your bot. Save the token you receive.',
      links: [
        { label: 'Open Telegram', url: 'https://t.me/BotFather' },
      ],
    },
    {
      title: 'Bot Token',
      description: 'Paste your Telegram bot token',
      fields: [
        {
          name: 'bot_token',
          label: 'Bot Token',
          type: 'textarea',
          placeholder: 'Paste the token from BotFather',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Bot token is required'
            if (!value.includes(':')) return 'Invalid bot token format'
            return null
          },
        },
      ],
      help: 'This token is provided by @BotFather when you create your bot.',
    },
    {
      title: 'Webhook Configuration',
      description: 'Configure Telegram to send updates to your AI',
      fields: [
        {
          name: 'webhook_url',
          label: 'Webhook URL',
          type: 'text',
          placeholder: '',
        },
      ],
      help: 'Copy this webhook URL to set up message forwarding in your Telegram bot settings.',
    },
  ],
}

// Registry of all configs
export const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  slack: SLACK_CONFIG,
  github: GITHUB_CONFIG,
  hubspot: HUBSPOT_CONFIG,
  gmail: GMAIL_CONFIG,
  sentry: SENTRY_CONFIG,
  linear: LINEAR_CONFIG,
  vercel: VERCEL_CONFIG,
  notion: NOTION_CONFIG,
  whatsapp: WHATSAPP_CONFIG,
  telegram: TELEGRAM_CONFIG,
}

export function getIntegrationConfig(integrationId: string): IntegrationConfig | undefined {
  return INTEGRATION_CONFIGS[integrationId]
}
