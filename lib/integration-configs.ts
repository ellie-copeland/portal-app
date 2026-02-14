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

// ============================================
// SLACK
// ============================================

export const SLACK_CONFIG: IntegrationConfig = {
  id: 'slack',
  name: 'Slack',
  icon: '💬',
  description: 'Connect Slack workspace. Clawdbot routes Slack messages to your AI employees.',
  category: 'communication',
  type: 'oauth',
  steps: [
    {
      title: '📋 Step 1: Create a Slack App',
      description: 'We need to create an app in your Slack workspace. This takes 2 minutes.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Open Slack Apps → [Link below] ↗
2. Click "Create New App" button (top right)
3. Choose "From scratch"
4. Name it anything (e.g., "My AI Agent")
5. Pick your workspace
6. Click "Create App"

You'll now be in the app settings. Keep this tab open for the next step.`,
      links: [
        { label: '→ Open Slack Apps', url: 'https://api.slack.com/apps' },
      ],
    },
    {
      title: '📋 Step 2: Set Permissions',
      description: 'Grant permissions so our AI can read and send messages.',
      fields: [],
      help: `📌 What to do:
1. In your app settings (from Step 1), click "OAuth & Permissions" in the left sidebar
2. Scroll down to "Scopes" section
3. Under "Bot Token Scopes", click "Add an OAuth Scope"
4. Add these 3 scopes:
   • chat:write (allows sending messages)
   • app_mentions:read (allows reading @mentions)
   • channels:read (allows reading channel info)
5. Click "Install to Workspace" at the top
6. Slack will ask for permission — click "Allow"

You'll now see a "Bot User OAuth Token" (starts with xoxb-). This is what we need next.`,
    },
    {
      title: '📋 Step 3: Copy Your Bot Token',
      description: 'Paste your Bot User OAuth Token below. This is what lets Clawdbot talk to Slack.',
      fields: [
        {
          name: 'bot_token',
          label: 'Bot User OAuth Token',
          type: 'textarea',
          placeholder: 'xoxb-your-token-here',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Bot token is required'
            if (!value.startsWith('xoxb-')) return 'Token should start with "xoxb-"'
            return null
          },
        },
      ],
      help: `📌 Where to find it:
1. Go back to your Slack app settings (api.slack.com/apps)
2. Click "OAuth & Permissions" in the left sidebar
3. Under "OAuth Tokens for Your Workspace", find "Bot User OAuth Token"
4. Click the copy icon next to it
5. Paste it in the field above

⚠️ Keep this token secret! It's like a password for your Slack integration.`,
    },
    {
      title: '📋 Step 4: Select Channels to Monitor',
      description: 'Choose which Slack channels your AI will monitor and respond in.',
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
      help: `📌 Tips:
• Select channels where you want AI to participate (e.g., #support, #alerts, #general)
• You can have the AI monitor without responding — just reading messages
• Add more channels later anytime

Why: This limits what your AI sees. We only give it access to channels you specify.`,
    },
    {
      title: '📋 Step 5: Pick Your AI Agent',
      description: 'Which of your AI employees should handle Slack messages?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 How this works:
• Messages from your selected Slack channels will be sent to this agent
• The agent will read them and respond (if configured to)
• Different agents can handle different channels (you set that up later)

Why: This lets you route different channels to different AI employees based on expertise.`,
    },
    {
      title: '✅ Done! Your Slack integration is ready',
      description: 'Click "Connect" below to save everything.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ I understand my AI will now monitor and respond in selected Slack channels', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Your AI employee will start monitoring the Slack channels you selected
• When someone mentions it (@YourAgentName), it will respond
• You can test it immediately by going to one of your selected channels
• To pause the AI, go to Integrations and toggle it off

Need help? You can edit these settings anytime.`,
    },
  ],
}

// ============================================
// GITHUB
// ============================================

export const GITHUB_CONFIG: IntegrationConfig = {
  id: 'github',
  name: 'GitHub',
  icon: '🐙',
  description: 'Connect GitHub. Clawdbot monitors PRs, issues, and deployments.',
  category: 'development',
  type: 'oauth',
  steps: [
    {
      title: '📋 Step 1: Create a GitHub Personal Access Token',
      description: 'GitHub needs a token so Clawdbot can access your repositories.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic) [Link below] ↗
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "Clawdbot Integration")
4. Under "Select scopes", check these boxes:
   • repo (full repo access)
   • read:org (read organization data)
5. Click "Generate token" at the bottom
6. Copy the token (you won't be able to see it again!)

Keep this page open — you'll paste the token in the next step.`,
      links: [
        { label: '→ Open GitHub Tokens', url: 'https://github.com/settings/tokens?type=beta' },
      ],
    },
    {
      title: '📋 Step 2: Paste Your GitHub Token',
      description: 'Paste the personal access token you just created.',
      fields: [
        {
          name: 'github_token',
          label: 'GitHub Personal Access Token',
          type: 'textarea',
          placeholder: 'ghp_xxxxxxxxxxxx',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'GitHub token is required'
            if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) return 'Token format looks wrong'
            return null
          },
        },
      ],
      help: `📌 Why we need this:
• This token lets Clawdbot read your PRs, issues, and commits
• It's read-only by default (unless you gave it write permissions)
• It's specific to your account, so only you can see what Clawdbot does

⚠️ Keep it secret! It's like a password.`,
    },
    {
      title: '📋 Step 3: Select Repositories to Monitor',
      description: 'Which repositories should your AI watch?',
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
      help: `📌 Tips:
• Pick repositories where you want AI to monitor PRs and issues
• Your AI will be able to review code and suggest improvements
• Start with 1-2 repos, add more later as needed

Why: This prevents your AI from accessing private repos you don't want it to touch.`,
    },
    {
      title: '📋 Step 4: Pick Your AI Agent',
      description: 'Which AI employee should review your code?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 How it works:
• This agent will monitor your selected repos
• It can review pull requests, comment on code, and suggest improvements
• Each repo can have a different agent (you configure that later)

Pro tip: Use your "Engineering" or "Code Quality" agent if you have one.`,
    },
    {
      title: '✅ All set! GitHub is connected',
      description: 'Click "Connect" to save and start monitoring.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ I want my AI to monitor PRs and issues in the selected repos', value: 'confirmed' }],
        },
      ],
      help: `🎉 Next steps:
• Create a new pull request in one of your monitored repos
• Your AI should appear as a reviewer shortly
• You can customize what it reviews (just comments, or actual code changes)

Having issues? Make sure your token has the "repo" scope enabled.`,
    },
  ],
}

// ============================================
// HUBSPOT
// ============================================

export const HUBSPOT_CONFIG: IntegrationConfig = {
  id: 'hubspot',
  name: 'HubSpot',
  icon: '🔶',
  description: 'Connect HubSpot. Clawdbot auto-logs calls, updates deals, tracks customer info.',
  category: 'crm',
  type: 'oauth',
  steps: [
    {
      title: '📋 Step 1: Create a HubSpot Private App',
      description: 'HubSpot uses "Private Apps" for integrations. We need to create one.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Go to HubSpot Settings → Integrations → Private Apps [Link below] ↗
2. Click "Create app" button (top right)
3. Go to the "Scopes" tab
4. Enable these scopes:
   • crm.objects.contacts.read
   • crm.objects.contacts.write
   • crm.objects.deals.read
   • crm.objects.deals.write
   • crm.objects.calls.read
   • crm.objects.calls.write
5. Click "Create app" at the bottom

You'll see your app in the list now.`,
      links: [
        { label: '→ Open HubSpot Private Apps', url: 'https://app.hubspot.com/l/private-apps' },
      ],
    },
    {
      title: '📋 Step 2: Copy Your Access Token',
      description: "Get your app's access token to connect Clawdbot.",
      fields: [
        {
          name: 'hubspot_token',
          label: 'HubSpot Private App Access Token',
          type: 'textarea',
          placeholder: 'pat-...',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            return null
          },
        },
      ],
      help: `📌 How to get it:
1. Go back to HubSpot Settings → Integrations → Private Apps
2. Find the app you just created
3. Click on it
4. You'll see "Access token" with a copy icon
5. Copy it and paste it above

⚠️ This is sensitive! Keep it secret.`,
    },
    {
      title: '📋 Step 3: Pick Your AI Agent',
      description: 'Which AI employee should manage your CRM data?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 What this agent can do:
• Log call notes automatically to contacts
• Update deal stages based on conversations
• Enrich contact information
• Send follow-up reminders

Pro tip: Use your "Sales" or "CRM Manager" agent for this.`,
    },
    {
      title: '✅ HubSpot is connected!',
      description: 'Click "Connect" to activate your CRM integration.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI can now read and update HubSpot contacts and deals', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Your AI will start monitoring conversations
• Call notes will auto-log to the relevant contact in HubSpot
• Deals will update automatically as conversations progress

Test it: Create a new deal and watch your AI track it!`,
    },
  ],
}

// ============================================
// GMAIL
// ============================================

export const GMAIL_CONFIG: IntegrationConfig = {
  id: 'gmail',
  name: 'Gmail',
  icon: '📧',
  description: 'Connect Gmail. Clawdbot drafts responses and auto-categorizes emails.',
  category: 'communication',
  type: 'oauth',
  steps: [
    {
      title: '📋 Step 1: Enable Gmail API',
      description: 'We need permission to connect to your Gmail account.',
      fields: [],
      help: `📌 Here's what to do:
1. Go to Google Cloud Console [Link below] ↗
2. Create a new project (or use an existing one)
3. Search for "Gmail API" in the search bar
4. Click "Gmail API"
5. Click "Enable"

That's it! Google has now enabled the Gmail API for you.`,
      links: [
        { label: '→ Open Google Cloud Console', url: 'https://console.cloud.google.com' },
      ],
    },
    {
      title: '📋 Step 2: Authorize Gmail Access',
      description: 'Connect your Gmail account to Clawdbot.',
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
      help: `📌 What happens next:
• You'll be redirected to Google
• Google will ask for permission to access Gmail
• You'll grant permission, then return here

Why we need this:
• Your AI needs to read emails to draft responses
• It can flag urgent messages
• It can help organize your inbox`,
    },
    {
      title: '📋 Step 3: Choose Email Labels to Monitor',
      description: 'Which Gmail labels should your AI watch?',
      fields: [
        {
          name: 'labels',
          label: 'Gmail Labels',
          type: 'multi-select',
          required: true,
          options: [
            { label: 'Inbox', value: 'INBOX' },
            { label: 'Support', value: 'Support' },
            { label: 'Sales', value: 'Sales' },
          ],
          validation: (value) => value?.length > 0 ? null : 'Select at least one label',
        },
      ],
      help: `📌 Tips:
• Select labels where you want AI to help (e.g., Support emails)
• The AI can read these emails and draft responses
• You'll review and approve before anything sends

Why: This keeps your AI focused on emails that matter.`,
    },
    {
      title: '📋 Step 4: Pick Your AI Agent',
      description: 'Which AI employee should handle your emails?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 What this agent does:
• Reads incoming emails from your selected labels
• Drafts responses (you review before sending)
• Flags urgent/important emails
• Suggests email threads to follow up on

Pro tip: Use your "Customer Support" or "Sales Support" agent.`,
    },
    {
      title: '✅ Gmail is ready!',
      description: 'Click "Connect" to activate email integration.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI can now read my Gmail and draft responses', value: 'confirmed' }],
        },
      ],
      help: `🎉 Next steps:
• New emails will start appearing in your AI's inbox
• It will draft responses for you to review
• All changes require your approval before sending

Your email security: Clawdbot is read-only by default. Nothing sends without you.`,
    },
  ],
}

// ============================================
// SENTRY
// ============================================

export const SENTRY_CONFIG: IntegrationConfig = {
  id: 'sentry',
  name: 'Sentry',
  icon: '🛡️',
  description: 'Connect Sentry. Clawdbot monitors errors and alerts your team.',
  category: 'monitoring',
  type: 'token',
  steps: [
    {
      title: '📋 Step 1: Create a Sentry API Token',
      description: 'We need an API token so Clawdbot can access your errors.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Go to Sentry Settings → Auth Tokens [Link below] ↗
2. Click "Create New Token" button
3. Give it a name (e.g., "Clawdbot")
4. Under "Scopes", select:
   • event:read
   • event:write
   • project:read
5. Click "Create Token"
6. Copy the token (you won't see it again!)

Keep this page open for the next step.`,
      links: [
        { label: '→ Open Sentry Auth Tokens', url: 'https://sentry.io/settings/auth-tokens/' },
      ],
    },
    {
      title: '📋 Step 2: Paste Your Sentry API Token',
      description: 'Paste the token you just created.',
      fields: [
        {
          name: 'sentry_token',
          label: 'Sentry API Token',
          type: 'textarea',
          placeholder: 'sntrys_xxxxxxxxxxxxx',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            return null
          },
        },
      ],
      help: `📌 Why we need this:
• This token lets Clawdbot read error data from Sentry
• Your AI can analyze stack traces and suggest fixes
• Incidents will trigger alerts to your team

Security: This token only has read access to errors.`,
    },
    {
      title: '📋 Step 3: Select Projects to Monitor',
      description: 'Which Sentry projects should your AI watch?',
      fields: [
        {
          name: 'projects',
          label: 'Sentry Projects',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one project',
        },
      ],
      help: `📌 Tips:
• Select projects you want monitored (e.g., your main API, web app, mobile)
• Your AI will get alerts when new errors happen
• You can add more projects later

Why: Limits monitoring to projects that matter for your business.`,
    },
    {
      title: '📋 Step 4: Pick Your AI Agent',
      description: 'Which AI employee should analyze errors?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 What this agent does:
• Monitors Sentry for new errors
• Analyzes stack traces
• Suggests root causes and fixes
• Alerts your team to critical issues

Pro tip: Use your "DevOps" or "Incident Response" agent.`,
    },
    {
      title: '✅ Sentry monitoring is active!',
      description: 'Click "Connect" to start monitoring errors.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI will monitor and analyze Sentry errors', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Errors will start flowing to your AI agent
• It will analyze them and suggest fixes
• You'll get alerts for critical issues
• Your AI will help prioritize what to fix first

Test it: Trigger a test error in Sentry and watch your AI respond!`,
    },
  ],
}

// ============================================
// LINEAR
// ============================================

export const LINEAR_CONFIG: IntegrationConfig = {
  id: 'linear',
  name: 'Linear',
  icon: '📋',
  description: 'Connect Linear. Clawdbot creates tickets and syncs issue status.',
  category: 'productivity',
  type: 'token',
  steps: [
    {
      title: '📋 Step 1: Create a Linear API Key',
      description: 'We need an API key so Clawdbot can create and update tickets.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Go to Linear Settings → API [Link below] ↗
2. Click "Create new" button
3. Give it a label (e.g., "Clawdbot")
4. Click "Create API Key"
5. Copy the key (you won't see it again!)

Keep this page open for the next step.`,
      links: [
        { label: '→ Open Linear API Settings', url: 'https://linear.app/settings/api' },
      ],
    },
    {
      title: '📋 Step 2: Paste Your Linear API Key',
      description: 'Paste the API key you just created.',
      fields: [
        {
          name: 'linear_token',
          label: 'Linear API Key',
          type: 'textarea',
          placeholder: 'lin_api_xxxxxxxxxxxx',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'API key is required'
            return null
          },
        },
      ],
      help: `📌 Why we need this:
• This key lets Clawdbot create and update Linear issues
• Your AI can convert messages into tickets
• It can update issue status as work progresses

Security: Keep this key secret!`,
    },
    {
      title: '📋 Step 3: Select Team & Projects',
      description: 'Which Linear team and projects should your AI manage?',
      fields: [
        {
          name: 'team',
          label: 'Linear Team',
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
      help: `📌 Tips:
• Select the team where you want issues created
• Choose projects your AI should track
• Your AI can move issues between these projects

Why: Keeps ticket creation organized in the right teams.`,
    },
    {
      title: '📋 Step 4: Pick Your AI Agent',
      description: 'Which AI employee should manage your Linear tickets?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 What this agent does:
• Creates Linear tickets from messages or alerts
• Updates issue status as work progresses
• Moves tickets between projects
• Assigns tickets to team members

Pro tip: Use your "Product Manager" or "Engineering Manager" agent.`,
    },
    {
      title: '✅ Linear integration is ready!',
      description: 'Click "Connect" to start creating tickets.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI can create and update Linear tickets', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Your AI will start creating Linear tickets
• It can update status, assign owners, and move tickets
• Your team will stay in sync across Slack, GitHub, and Linear

Start using it: Tell your AI "Create a Linear ticket for..." in Slack!`,
    },
  ],
}

// ============================================
// VERCEL
// ============================================

export const VERCEL_CONFIG: IntegrationConfig = {
  id: 'vercel',
  name: 'Vercel',
  icon: '▲',
  description: 'Connect Vercel. Clawdbot monitors deployments and build status.',
  category: 'development',
  type: 'token',
  steps: [
    {
      title: '📋 Step 1: Create a Vercel API Token',
      description: 'We need a token so Clawdbot can monitor your deployments.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Go to Vercel Settings → Tokens [Link below] ↗
2. Click "Create" button
3. Give it a name (e.g., "Clawdbot")
4. Set expiration to "No expiration" (optional)
5. Click "Create Token"
6. Copy the token (you won't see it again!)

Keep this page open for the next step.`,
      links: [
        { label: '→ Open Vercel Tokens', url: 'https://vercel.com/account/tokens' },
      ],
    },
    {
      title: '📋 Step 2: Paste Your Vercel API Token',
      description: 'Paste the token you just created.',
      fields: [
        {
          name: 'vercel_token',
          label: 'Vercel API Token',
          type: 'textarea',
          placeholder: 'VercelToken...',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            return null
          },
        },
      ],
      help: `📌 Why we need this:
• This token lets Clawdbot see your deployments
• Your AI can monitor build status and performance
• Incidents will trigger alerts

Security: This is read-only for monitoring purposes.`,
    },
    {
      title: '📋 Step 3: Select Projects to Monitor',
      description: 'Which Vercel projects should your AI watch?',
      fields: [
        {
          name: 'projects',
          label: 'Vercel Projects',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one project',
        },
      ],
      help: `📌 Tips:
• Select projects to monitor for deployments
• Your AI will get alerts on build failures
• It can correlate deployments with errors

Why: Focus on projects that matter to your users.`,
    },
    {
      title: '📋 Step 4: Pick Your AI Agent',
      description: 'Which AI employee should monitor deployments?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 What this agent does:
• Monitors Vercel for new deployments
• Watches for build failures
• Alerts your team to deployment issues
• Can correlate with Sentry errors

Pro tip: Use your "DevOps" or "Infrastructure" agent.`,
    },
    {
      title: '✅ Vercel monitoring is active!',
      description: 'Click "Connect" to start watching deployments.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI will monitor Vercel deployments', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Deployments will flow to your AI agent
• Build failures will trigger immediate alerts
• Your AI can help debug deployment issues

Test it: Deploy something to Vercel and watch your AI monitor it!`,
    },
  ],
}

// ============================================
// NOTION
// ============================================

export const NOTION_CONFIG: IntegrationConfig = {
  id: 'notion',
  name: 'Notion',
  icon: '📝',
  description: 'Connect Notion. Clawdbot syncs knowledge base and creates pages.',
  category: 'productivity',
  type: 'token',
  steps: [
    {
      title: '📋 Step 1: Create a Notion Integration',
      description: 'Notion uses "Internal Integrations" for API access.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Go to Notion My Integrations [Link below] ↗
2. Click "Create new integration" button
3. Name it (e.g., "Clawdbot")
4. Select your workspace
5. Go to the "Capabilities" tab
6. Enable "Read content" and "Update content"
7. Click "Save changes"

You'll now see a "Internal Integration Token". Keep this page open.`,
      links: [
        { label: '→ Open Notion Integrations', url: 'https://www.notion.so/my-integrations' },
      ],
    },
    {
      title: '📋 Step 2: Copy Your Integration Token',
      description: 'Paste your Notion integration token below.',
      fields: [
        {
          name: 'notion_token',
          label: 'Internal Integration Token',
          type: 'textarea',
          placeholder: 'secret_xxxxxxxxxxxxx',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Token is required'
            if (!value.startsWith('secret_')) return 'Token should start with "secret_"'
            return null
          },
        },
      ],
      help: `📌 How to get it:
1. Go back to Notion My Integrations
2. Click on your integration
3. Find "Internal Integration Token"
4. Click "Show" and then copy it
5. Paste it above

⚠️ This is like a password — keep it secret!`,
    },
    {
      title: '📋 Step 3: Grant Access to Pages',
      description: 'Tell Notion which pages Clawdbot can access.',
      fields: [
        {
          name: 'pages',
          label: 'Notion Pages to Access',
          type: 'multi-select',
          required: true,
          options: [],
          validation: (value) => value?.length > 0 ? null : 'Select at least one page',
        },
      ],
      help: `📌 Here's how to grant access:
1. Open each Notion page you selected above
2. Click "Share" (top right)
3. Search for your integration by name
4. Click "Add" to invite it

Why: This lets your AI read and edit these specific pages in Notion.`,
    },
    {
      title: '📋 Step 4: Pick Your AI Agent',
      description: 'Which AI employee should manage your Notion workspace?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 What this agent does:
• Reads your Notion knowledge base
• Creates new pages from conversations
• Updates existing pages with new information
• Keeps your documentation fresh

Pro tip: Use your "Documentation" or "Knowledge Manager" agent.`,
    },
    {
      title: '✅ Notion is connected!',
      description: 'Click "Connect" to activate Notion sync.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI can read and update my Notion workspace', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Your AI will access your Notion knowledge base
• It can reference it when answering questions
• It can create new documentation automatically
• Your team stays in sync across all tools

Start using it: Your AI can now reference Notion pages!`,
    },
  ],
}

// ============================================
// WHATSAPP
// ============================================

export const WHATSAPP_CONFIG: IntegrationConfig = {
  id: 'whatsapp',
  name: 'WhatsApp',
  icon: '📱',
  description: 'Connect WhatsApp via Clawdbot pairing. No Business API needed.',
  category: 'communication',
  type: 'bot-token',
  steps: [
    {
      title: '📋 Step 1: Prepare Your Phone',
      description: 'Keep WhatsApp open on your phone — we\'ll generate a QR code to pair.',
      fields: [],
      help: `📌 Here's what to do:
1. Open WhatsApp on your phone
2. Go to WhatsApp Settings → Linked Devices
3. Make sure you can see the option to "Link a Device"
4. Keep the app open — you'll scan a QR code next

Why Clawdbot pairing?
• No need for WhatsApp Business API account
• Simpler setup (just scan & pair)
• Secure (uses your personal WhatsApp)
• Your messages stay encrypted`,
    },
    {
      title: '📋 Step 2: Generate QR Code & Pair',
      description: 'Clawdbot will generate a QR code. Scan it with your phone.',
      fields: [
        {
          name: 'qr_code',
          label: 'QR Code',
          type: 'text',
          placeholder: 'Click "Generate QR Code" button',
        },
      ],
      help: `📌 Here's what to do:
1. Click "Generate QR Code" button (appears after this step loads)
2. A QR code will appear below
3. On your phone, go to WhatsApp Settings → Linked Devices
4. Tap "Link a Device"
5. Point your phone camera at the QR code to scan it
6. WhatsApp will pair with Clawdbot

⏱️ The QR code expires in 60 seconds. If it expires, just generate a new one.`,
    },
    {
      title: '📋 Step 3: Pick Your AI Agent',
      description: 'Which AI employee should handle WhatsApp messages?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 How it works:
• Messages sent to your WhatsApp account will go to this agent
• The agent can read them and respond
• All responses are sent through your WhatsApp account (your messages)

Example uses:
• Customer support (respond to customer inquiries)
• Sales (follow up on leads)
• Personal assistant (manage your messages)`,
    },
    {
      title: '✅ WhatsApp is paired!',
      description: 'Click "Connect" to activate WhatsApp integration.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI will handle WhatsApp messages', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Your AI will start monitoring WhatsApp messages
• Incoming messages will be shown to your agent
• Your agent can draft responses for you to approve
• All messages go through your personal WhatsApp

Test it: Send yourself a WhatsApp message and watch your AI respond!`,
    },
  ],
}

// ============================================
// TELEGRAM
// ============================================

export const TELEGRAM_CONFIG: IntegrationConfig = {
  id: 'telegram',
  name: 'Telegram',
  icon: '✈️',
  description: 'Connect Telegram via Clawdbot bot routing. Simple token setup.',
  category: 'communication',
  type: 'bot-token',
  steps: [
    {
      title: '📋 Step 1: Create a Telegram Bot',
      description: 'Use @BotFather to create your bot. Takes 1 minute.',
      fields: [],
      help: `📌 Here's exactly what to do:
1. Open Telegram and search for "@BotFather" [Link below] ↗
2. Click "Start" to message him
3. Type: /newbot
4. BotFather will ask for a name (e.g., "My Support Bot")
5. Type a name (anything you want — this is just for you)
6. BotFather will ask for a username (e.g., "my_support_bot")
7. Choose a unique username (must end in "bot")
8. BotFather will respond with your bot token

Save this token — you'll need it in the next step.`,
      links: [
        { label: '→ Open Telegram BotFather', url: 'https://t.me/BotFather' },
      ],
    },
    {
      title: '📋 Step 2: Paste Your Bot Token',
      description: 'Paste the token @BotFather gave you.',
      fields: [
        {
          name: 'bot_token',
          label: 'Telegram Bot Token',
          type: 'textarea',
          placeholder: '123456789:ABCdefGHIjklmno...',
          required: true,
          validation: (value) => {
            if (!value || value.trim().length === 0) return 'Bot token is required'
            if (!value.includes(':')) return 'Token format looks wrong (should contain a colon)'
            return null
          },
        },
      ],
      help: `📌 How to get it again if you lost it:
1. Message @BotFather with /mybots
2. Select your bot from the list
3. Click "API Token"
4. BotFather will show you the token
5. Copy and paste it above

⚠️ Keep this token secret! It's like a password for your bot.`,
    },
    {
      title: '📋 Step 3: Pick Your AI Agent',
      description: 'Which AI employee should handle Telegram messages?',
      fields: [
        {
          name: 'agentId',
          label: 'AI Agent',
          type: 'select',
          required: true,
          options: [],
          validation: (value) => value ? null : 'Select an agent',
        },
      ],
      help: `📌 How it works:
• Messages to your Telegram bot will go to this agent
• The agent reads them and responds
• All responses are sent through your bot (your account sends them)

Example uses:
• Support bot (answer customer questions)
• News bot (send notifications to followers)
• Personal AI assistant (get help in Telegram)`,
    },
    {
      title: '📋 Step 4: How to Use Your Bot',
      description: 'Here\'s how to start using your AI-powered Telegram bot.',
      fields: [],
      help: `📌 Next steps:
1. Open Telegram and search for your bot username
2. Click "Start" to begin
3. Send a message to your bot
4. Your AI agent will receive it and respond

Tips:
• You can share your bot with others (just give them the username)
• Messages are handled privately by Clawdbot
• Your bot stays active 24/7

Share your bot: Tell friends "Message @[your_bot_username]" on Telegram!`,
    },
    {
      title: '✅ Telegram bot is ready!',
      description: 'Click "Connect" to activate your Telegram integration.',
      fields: [
        {
          name: 'confirm',
          label: 'Confirmation',
          type: 'checkbox',
          required: true,
          options: [{ label: '✓ My AI will handle messages to my Telegram bot', value: 'confirmed' }],
        },
      ],
      help: `🎉 What happens next:
• Your bot is live and ready to receive messages
• Every message will go to your selected AI agent
• Your agent will respond (you can review first if needed)
• Your bot will stay online 24/7

Test it immediately: Message your bot on Telegram!`,
    },
  ],
}

// ============================================
// REGISTRY
// ============================================

export function getIntegrationConfig(id: string): IntegrationConfig | undefined {
  return INTEGRATION_CONFIGS[id]
}

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
