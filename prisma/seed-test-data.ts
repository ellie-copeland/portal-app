import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('TestPass123!', 12)

  // Create 3 users (one per team as owner)
  const alice = await prisma.user.upsert({
    where: { email: 'alice@acmecorp.com' },
    update: {},
    create: { email: 'alice@acmecorp.com', name: 'Alice Chen', passwordHash: hash, role: 'OWNER' },
  })
  const bob = await prisma.user.upsert({
    where: { email: 'bob@startupx.io' },
    update: {},
    create: { email: 'bob@startupx.io', name: 'Bob Martinez', passwordHash: hash, role: 'OWNER' },
  })
  const carol = await prisma.user.upsert({
    where: { email: 'carol@devshop.dev' },
    update: {},
    create: { email: 'carol@devshop.dev', name: 'Carol Wu', passwordHash: hash, role: 'OWNER' },
  })

  // Create 3 teams
  const acme = await prisma.team.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme-corp', plan: 'PRO' },
  })
  const startupx = await prisma.team.upsert({
    where: { slug: 'startup-x' },
    update: {},
    create: { name: 'Startup X', slug: 'startup-x', plan: 'FREE' },
  })
  const devshop = await prisma.team.upsert({
    where: { slug: 'devshop' },
    update: {},
    create: { name: 'DevShop', slug: 'devshop', plan: 'ENTERPRISE' },
  })

  // Assign owners to teams
  for (const [user, team] of [[alice, acme], [bob, startupx], [carol, devshop]] as const) {
    await prisma.teamMember.upsert({
      where: { userId_teamId: { userId: (user as any).id, teamId: (team as any).id } },
      update: {},
      create: { userId: (user as any).id, teamId: (team as any).id, role: 'OWNER' },
    })
  }

  // Cross-team membership: Alice is also a MEMBER of Startup X (for multi-workspace testing)
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: alice.id, teamId: startupx.id } },
    update: {},
    create: { userId: alice.id, teamId: startupx.id, role: 'MEMBER' },
  })

  // Create agents — 3 per team (1 each for red team variety)
  const agents: any[] = []

  // Acme Corp agents
  const acmeAgent1 = await prisma.agent.create({
    data: {
      teamId: acme.id, createdById: alice.id, name: 'Sales Assistant',
      description: 'Handles lead qualification and follow-ups',
      model: 'gpt-4', status: 'ACTIVE', type: 'MAIN',
      systemPrompt: 'You are a sales assistant for Acme Corp. Help qualify leads, draft follow-up emails, and track pipeline status.',
    },
  })
  const acmeAgent2 = await prisma.agent.create({
    data: {
      teamId: acme.id, createdById: alice.id, name: 'Code Reviewer',
      description: 'Reviews PRs and suggests improvements',
      model: 'claude-3-5-sonnet', status: 'ACTIVE', type: 'SUB',
      systemPrompt: 'You are a senior code reviewer. Analyze pull requests for bugs, performance issues, and style violations.',
    },
  })
  const acmeAgent3 = await prisma.agent.create({
    data: {
      teamId: acme.id, createdById: alice.id, name: 'Support Bot',
      description: 'Customer support triage and FAQ handling',
      model: 'gpt-4', status: 'INACTIVE', type: 'MAIN',
      systemPrompt: 'You handle customer support inquiries for Acme Corp. Triage issues by severity and route to the right team.',
    },
  })
  agents.push(acmeAgent1, acmeAgent2, acmeAgent3)

  // Startup X agents
  const sxAgent1 = await prisma.agent.create({
    data: {
      teamId: startupx.id, createdById: bob.id, name: 'Onboarding Guide',
      description: 'Walks new users through product setup',
      model: 'gpt-4', status: 'ACTIVE', type: 'MAIN',
      systemPrompt: 'You guide new users through Startup X product setup. Be friendly, concise, and proactive about common issues.',
    },
  })
  const sxAgent2 = await prisma.agent.create({
    data: {
      teamId: startupx.id, createdById: bob.id, name: 'Analytics Reporter',
      description: 'Generates weekly metrics summaries',
      model: 'claude-3-5-sonnet', status: 'ACTIVE', type: 'SUB',
      systemPrompt: 'You generate weekly analytics reports. Summarize KPIs, highlight trends, and flag anomalies.',
    },
  })
  agents.push(sxAgent1, sxAgent2)

  // DevShop agents
  const dsAgent1 = await prisma.agent.create({
    data: {
      teamId: devshop.id, createdById: carol.id, name: 'DevOps Monitor',
      description: 'Watches infrastructure and alerts on issues',
      model: 'gpt-4', status: 'ACTIVE', type: 'MAIN',
      systemPrompt: 'You monitor DevShop infrastructure. Alert on high CPU, memory leaks, failed deployments, and unusual traffic patterns.',
    },
  })
  const dsAgent2 = await prisma.agent.create({
    data: {
      teamId: devshop.id, createdById: carol.id, name: 'Sprint Planner',
      description: 'Helps with sprint planning and task breakdown',
      model: 'gpt-4', status: 'ACTIVE', type: 'MAIN',
      systemPrompt: 'You assist with sprint planning. Break down epics into stories, estimate effort, and suggest priorities.',
    },
  })
  agents.push(dsAgent1, dsAgent2)

  // Create conversations with messages for each active agent
  const convos = [
    { agent: acmeAgent1, user: alice, messages: [
      { role: 'USER' as const, content: 'Can you draft a follow-up email for the Meridian Corp lead? They showed interest in our enterprise plan last week.' },
      { role: 'ASSISTANT' as const, content: 'Here\'s a draft follow-up for Meridian Corp:\n\nSubject: Following Up on Acme Enterprise Plan\n\nHi Sarah,\n\nGreat speaking with you last week about your team\'s workflow challenges. I wanted to follow up on the enterprise plan features we discussed — particularly the custom integrations and dedicated support.\n\nWould Thursday at 2 PM work for a quick demo with our solutions engineer?\n\nBest,\nAlice' },
      { role: 'USER' as const, content: 'Perfect. Also, what\'s the status on the Zenith deal?' },
      { role: 'ASSISTANT' as const, content: 'Based on the pipeline data, Zenith Technologies is in the "Proposal Sent" stage (sent Feb 8). No response yet — it\'s been 5 days. I\'d recommend a gentle check-in call tomorrow. Want me to draft talking points?' },
    ]},
    { agent: acmeAgent2, user: alice, messages: [
      { role: 'USER' as const, content: 'Review this function:\n```\nfunction processData(items) {\n  let result = [];\n  for (let i = 0; i <= items.length; i++) {\n    result.push(items[i].toUpperCase());\n  }\n  return result;\n}\n```' },
      { role: 'ASSISTANT' as const, content: '**2 issues found:**\n\n1. **Off-by-one error (Critical):** `i <= items.length` should be `i < items.length`. The current code will access `items[items.length]` which is `undefined`, causing a runtime error on `.toUpperCase()`.\n\n2. **No null check:** If any item is `null`/`undefined`, `.toUpperCase()` will throw. Consider:\n```js\nfunction processData(items) {\n  return items?.map(item => item?.toUpperCase() ?? \'\') ?? [];\n}\n```\nAlso more concise using `.map()` instead of manual loop.' },
    ]},
    { agent: sxAgent1, user: bob, messages: [
      { role: 'USER' as const, content: 'A new user just signed up — company name "TechFlow". Walk me through what they should do first.' },
      { role: 'ASSISTANT' as const, content: 'Here\'s the recommended onboarding flow for TechFlow:\n\n1. **Create workspace** — They should name it "TechFlow" and invite their team\n2. **Connect integrations** — Start with Slack (takes 30 seconds)\n3. **Create first agent** — I\'d suggest the "Customer Support" template as a quick win\n4. **Test in sandbox** — Run 3-5 test conversations before going live\n5. **Deploy to channel** — Push the agent to their Slack workspace\n\nTypical time to first working agent: ~15 minutes. Want me to send them a welcome email with these steps?' },
    ]},
    { agent: dsAgent1, user: carol, messages: [
      { role: 'USER' as const, content: 'What\'s the current status of our production cluster?' },
      { role: 'ASSISTANT' as const, content: '**Production Cluster Status (as of 9:30 PM MST):**\n\n🟢 **API Servers (3/3):** Healthy — avg response time 142ms\n🟢 **Database:** Primary healthy, replica lag 12ms (normal)\n🟡 **Worker Queue:** 847 jobs pending (elevated — usually ~200). Investigating.\n🟢 **CDN:** 99.97% cache hit rate\n🔴 **Alert:** Disk usage on worker-02 at 87%. Recommend clearing old logs.\n\nThe worker queue spike started ~20 min ago. Looks like a batch import triggered by the nightly ETL job running 2 hours early. Should I dig deeper?' },
      { role: 'USER' as const, content: 'Yes, check why the ETL ran early and clean up worker-02 logs.' },
      { role: 'ASSISTANT' as const, content: 'Investigated:\n\n**ETL Early Run:** The cron schedule was changed in last deploy (commit `a3f8d2c` by dev-03). Changed from `0 2 * * *` to `0 0 * * *` — looks intentional but wasn\'t communicated. Recommend adding to deploy checklist.\n\n**Worker-02 Cleanup:** Cleared 12GB of logs older than 7 days. Disk now at 54%. Set up log rotation to prevent recurrence (7-day retention, gzip compression).\n\nWorker queue is draining — down to 312 jobs. Should normalize in ~10 min.' },
    ]},
  ]

  for (const convo of convos) {
    const conversation = await prisma.conversation.create({
      data: {
        agentId: convo.agent.id,
        userId: convo.user.id,
        title: `Chat with ${convo.agent.name}`,
      },
    })

    for (let i = 0; i < convo.messages.length; i++) {
      const msg = convo.messages[i]
      const tokens = Math.floor(msg.content.length / 4) // rough estimate
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: msg.role,
          content: msg.content,
          tokensUsed: tokens,
          createdAt: new Date(Date.now() - (convo.messages.length - i) * 60000), // 1 min apart
        },
      })
    }

    // Create execution records for assistant messages
    const assistantMsgs = convo.messages.filter(m => m.role === 'ASSISTANT')
    for (const msg of assistantMsgs) {
      await prisma.execution.create({
        data: {
          agentId: convo.agent.id,
          userId: convo.user.id,
          teamId: convo.agent.teamId,
          input: 'Chat message',
          output: msg.content.substring(0, 200),
          status: 'SUCCESS',
          tokensUsed: Math.floor(msg.content.length / 4),
          cost: Math.floor(msg.content.length / 4) * 0.00003,
          duration: Math.floor(Math.random() * 2000) + 500,
          trigger: 'chat',
        },
      })
    }
  }

  console.log('✅ Seeded: 3 users, 3 teams, 7 agents, 4 conversations with messages, execution records')
  console.log('\nTest credentials (all same password: TestPass123!):')
  console.log('  alice@acmecorp.com  → Acme Corp (PRO) + Startup X (MEMBER)')
  console.log('  bob@startupx.io    → Startup X (FREE)')
  console.log('  carol@devshop.dev  → DevShop (ENTERPRISE)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
