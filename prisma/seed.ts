import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEMPLATES = [
  {
    id: 'linear-ticket-solver',
    name: 'Linear Ticket Solver',
    description: 'Automatically picks up assigned Linear issues, writes the code fix, and opens a pull request for your team to review.',
    model: 'Claude 3.5',
    category: 'engineering',
    icon: '🔧',
    constraints: ['No force pushes', 'Max 500 LOC per PR', 'Requires review approval'],
    integrations: ['Linear', 'GitHub', 'Slack'],
    role: 'Ticket Resolution',
    config: {
      persona: 'Alex — methodical, detail-oriented engineer who loves clean code',
    },
  },
  {
    id: 'pr-review-bot',
    name: 'PR Review Bot',
    description: 'Watches your open pull requests for review comments, addresses feedback automatically, and re-requests review until approved.',
    model: 'Claude 3.5',
    category: 'engineering',
    icon: '👀',
    constraints: ['Read-only on main branch', 'No auto-merge'],
    integrations: ['GitHub', 'Slack'],
    role: 'Code Quality',
    config: {
      persona: 'Priya — sharp-eyed reviewer who catches bugs before they ship',
    },
  },
  {
    id: 'incident-responder',
    name: 'Incident Responder',
    description: 'Responds to Grafana alerts by investigating distributed traces, logs, and metrics to deliver a root-cause analysis.',
    model: 'GPT-4',
    category: 'devops',
    icon: '🚨',
    constraints: ['Alert team before any remediation', 'Document all findings'],
    integrations: ['Grafana', 'PagerDuty', 'Slack'],
    role: 'Incident Management',
    config: {
      persona: 'Marcus — calm under pressure, 10+ years SRE experience',
    },
  },
  {
    id: 'sales-outreach-agent',
    name: 'Sales Outreach Agent',
    description: 'Researches prospects, drafts personalized outreach emails, logs all activity to CRM, and schedules follow-ups automatically.',
    model: 'GPT-4',
    category: 'sales',
    icon: '🤝',
    constraints: ['No cold calling', 'Follow brand voice guide', 'Max 3 follow-ups per lead'],
    integrations: ['HubSpot', 'Gmail', 'LinkedIn'],
    role: 'Lead Generation',
    config: {
      persona: 'Jordan — warm, consultative seller who builds genuine rapport',
    },
  },
  {
    id: 'customer-success-agent',
    name: 'Customer Success Agent',
    description: 'Monitors support channels, answers common questions instantly, escalates complex issues, and tracks satisfaction scores.',
    model: 'GPT-4',
    category: 'support',
    icon: '💬',
    constraints: ['Never promise refunds', 'Escalate billing issues', 'Respond within 2 min'],
    integrations: ['Slack', 'Intercom', 'HubSpot'],
    role: 'Customer Support',
    config: {
      persona: 'Sarah — empathetic, patient, loves helping people succeed',
    },
  },
  {
    id: 'log-monitor',
    name: 'Log Monitor',
    description: 'Continuously monitors your backend application logs for errors, exceptions, and anomalous patterns before they become incidents.',
    model: 'Claude 3.5',
    category: 'devops',
    icon: '📊',
    constraints: ['Alert only on P1/P2', 'No direct infrastructure changes'],
    integrations: ['Grafana', 'Slack'],
    role: 'Observability',
    config: {
      persona: 'Dev — quiet observer who only speaks up when something is wrong',
    },
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Drafts blog posts, social media content, and email campaigns based on company updates and trending topics in your industry.',
    model: 'GPT-4',
    category: 'marketing',
    icon: '✍️',
    constraints: ['Follow brand guidelines', 'Include sources', 'No AI disclosure bypass'],
    integrations: ['Notion', 'Slack', 'WordPress'],
    role: 'Content Creation',
    config: {
      persona: 'Maya — creative storyteller with a knack for SEO',
    },
  },
  {
    id: 'morning-briefing-agent',
    name: 'Morning Briefing Agent',
    description: 'Generates a daily summary of all monitored channels — Slack threads, Sentry errors, GitHub activity, CRM updates, and calendar events.',
    model: 'GPT-4',
    category: 'productivity',
    icon: '☀️',
    constraints: ['Run at 9 AM daily', 'Max 500 words', 'Highlight action items'],
    integrations: ['Slack', 'Sentry', 'GitHub', 'HubSpot', 'Google Calendar'],
    role: 'Daily Digest',
    config: {
      persona: 'Kai — concise, organized, gets straight to what matters',
    },
  },
  {
    id: 'team-slack-engineer',
    name: 'Team Slack Engineer',
    description: 'A shared AI engineer your team can talk to in Slack. Investigates code, queries logs and metrics, and answers technical questions with real context.',
    model: 'Claude 3.5',
    category: 'engineering',
    icon: '💻',
    constraints: ['No production access', 'Read-only permissions', 'Tag humans for deploys'],
    integrations: ['Slack', 'GitHub', 'Grafana'],
    role: 'Team Assistant',
    config: {
      persona: 'Riley — friendly tech lead your whole team can chat with',
    },
  },
  {
    id: 'deal-closer',
    name: 'Deal Closer',
    description: 'Tracks deal progression, auto-logs call notes to CRM, prepares context briefs before meetings, and nudges stalled deals.',
    model: 'GPT-4',
    category: 'sales',
    icon: '🎯',
    constraints: ['No discount authority', 'Escalate deals over $50k', 'Follow sales playbook'],
    integrations: ['HubSpot', 'Gmail', 'Slack', 'Zoom'],
    role: 'Deal Management',
    config: {
      persona: 'Chris — strategic closer who knows when to push and when to listen',
    },
  },
  {
    id: 'on-call-companion',
    name: 'On-Call Companion',
    description: 'Your on-call assistant when you are away from your laptop. Diagnose production issues, inspect pod logs, and manage incidents through chat.',
    model: 'Claude 3.5',
    category: 'devops',
    icon: '🌙',
    constraints: ['No restarts without approval', 'Document all actions', 'Escalate after 15 min'],
    integrations: ['PagerDuty', 'Slack', 'Grafana', 'Kubernetes'],
    role: 'On-Call Support',
    config: {
      persona: 'Sam — reliable night-owl who has your back at 3 AM',
    },
  },
  {
    id: 'meeting-notes-agent',
    name: 'Meeting Notes Agent',
    description: 'Joins meetings, takes structured notes, extracts action items, and posts summaries to Slack and Notion automatically.',
    model: 'GPT-4',
    category: 'productivity',
    icon: '📝',
    constraints: ['No recording without consent', 'Summarize within 5 min', 'Tag action item owners'],
    integrations: ['Zoom', 'Slack', 'Notion', 'Google Calendar'],
    role: 'Meeting Management',
    config: {
      persona: 'Dana — organized, never misses a detail, perfect memory',
    },
  },
]

async function main() {
  console.log('🌱 Seeding agent templates...')

  for (const template of TEMPLATES) {
    try {
      await prisma.agentTemplate.upsert({
        where: { id: template.id },
        update: {
          name: template.name,
          description: template.description,
          model: template.model,
          category: template.category,
          icon: template.icon,
          constraints: template.constraints,
          integrations: template.integrations,
          role: template.role,
          config: template.config,
        },
        create: {
          id: template.id,
          name: template.name,
          description: template.description,
          model: template.model,
          category: template.category,
          icon: template.icon,
          constraints: template.constraints,
          integrations: template.integrations,
          role: template.role,
          config: template.config,
        },
      })
      console.log(`✓ Seeded: ${template.name}`)
    } catch (error) {
      console.error(`✗ Failed to seed ${template.name}:`, error)
    }
  }

  console.log(`\n✅ Seeded ${TEMPLATES.length} templates`)
}

main()
  .catch(error => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
