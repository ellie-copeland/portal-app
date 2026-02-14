import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEMPLATES = [
  // Engineering
  { name: 'Code Reviewer', description: 'Reviews PRs, suggests improvements, checks for security issues', category: 'Engineering', model: 'claude-3.5-sonnet', role: 'Code Quality', constraints: ['Read-only access', 'No auto-merge'], integrations: ['GitHub', 'Linear'] },
  { name: 'Incident Responder', description: 'Monitors Sentry errors, correlates with deploys, alerts on-call engineers', category: 'Engineering', model: 'gpt-4', role: 'Error Monitor', constraints: ['Engineering channels only'], integrations: ['Sentry', 'PagerDuty', 'Slack'] },
  // Sales
  { name: 'Sales Assistant', description: 'CRM automation — logs calls, updates deals, drafts follow-ups', category: 'Sales', model: 'gpt-4', role: 'Sales Support', constraints: ['Product knowledge only', 'No pricing overrides'], integrations: ['HubSpot', 'Gmail'] },
  { name: 'Lead Qualifier', description: 'Scores inbound leads, enriches contact data, routes to correct rep', category: 'Sales', model: 'gpt-4', role: 'Lead Scoring', constraints: ['No direct outreach'], integrations: ['HubSpot', 'LinkedIn'] },
  // DevOps
  { name: 'Deploy Monitor', description: 'Watches CI/CD pipelines, alerts on failures, auto-retries flaky tests', category: 'DevOps', model: 'claude-3.5-sonnet', role: 'CI/CD Monitor', constraints: ['No production deploys'], integrations: ['GitHub', 'Grafana'] },
  { name: 'On-Call Companion', description: 'Summarizes alerts, gathers context, suggests runbook actions during incidents', category: 'DevOps', model: 'gpt-4', role: 'Incident Support', constraints: ['Suggest only, no auto-remediation'], integrations: ['PagerDuty', 'Slack', 'Grafana'] },
  // Productivity
  { name: 'Morning Briefing', description: 'Daily summary of all monitored channels — Slack, email, GitHub, CRM', category: 'Productivity', model: 'gpt-4', role: 'Daily Digest', constraints: ['Scheduled only', '9 AM daily'], integrations: ['Slack', 'Gmail', 'GitHub'] },
  { name: 'Meeting Prep', description: 'Gathers context before meetings — attendee history, open issues, recent conversations', category: 'Productivity', model: 'gpt-4', role: 'Meeting Assistant', constraints: ['Read-only'], integrations: ['Google Calendar', 'Slack', 'Notion'] },
  // Support
  { name: 'Customer Support', description: 'Primary agent for customer support — monitors Slack, email, and chat', category: 'Support', model: 'gpt-4', role: 'Support Manager', constraints: ['No financial advice', 'Escalate complex issues'], integrations: ['Slack', 'Gmail'] },
  { name: 'FAQ Bot', description: 'Answers common questions using knowledge base, routes complex issues to humans', category: 'Support', model: 'gpt-4', role: 'Knowledge Base', constraints: ['Knowledge base only', 'No improvisation'], integrations: ['Slack'] },
  // Marketing
  { name: 'Content Writer', description: 'Drafts blog posts, social media copy, and email campaigns from briefs', category: 'Marketing', model: 'claude-3.5-sonnet', role: 'Content Creator', constraints: ['Brand voice guidelines', 'Needs approval before publish'], integrations: ['WordPress', 'LinkedIn'] },
  { name: 'Social Listener', description: 'Monitors brand mentions, sentiment analysis, competitive intelligence', category: 'Marketing', model: 'gpt-4', role: 'Brand Monitor', constraints: ['No direct replies', 'Report only'], integrations: ['Slack'] },
]

async function main() {
  console.log('Seeding templates...')

  for (const template of TEMPLATES) {
    await prisma.agentTemplate.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
      update: template,
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template,
      },
    })
  }

  console.log(`Seeded ${TEMPLATES.length} templates`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
