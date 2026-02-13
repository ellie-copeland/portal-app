# Command Center - Quick Start Guide

## What's New

The **Command Center** is now the default landing page of the Cloud Employee Portal. It provides real-time monitoring and analytics for your OpenClaw agents.

## Accessing It

1. Start the portal:
   ```bash
   cd ~/.openclaw/workspace/portal-app
   npm run dev
   ```

2. Open browser: http://localhost:3000

3. You're automatically on the Command Center dashboard!

## The Tabs Explained

### 📊 Dashboard
**Your at-a-glance view**
- Total agents running
- How many are online right now
- Total tokens used
- Total cost
- Quick agent status list
- Cost breakdown by model

### 🤖 Agents
**Detailed agent information**
| Column | Shows |
|--------|-------|
| Agent ID | Name of the agent |
| Status | Online/Idle/Offline (by last activity) |
| Model | Which LLM they're using |
| Sessions | How many active sessions |
| Tokens | Total tokens consumed |
| Last Activity | When they last ran |

**Status Guide:**
- 🟢 **Online**: Active in last 5 minutes
- 🟡 **Idle**: Last active 5-60 minutes ago
- ⚫ **Offline**: Inactive for >1 hour

### 💬 Chats
**Recent conversations**
Shows the 200 most recent messages across all agents:
- Who said it (user/assistant)
- Which session it's from
- Message preview
- Agent it ran in

### 💰 Usage & Cost
**Token usage and pricing**
- **Input Tokens**: How many tokens agents read
- **Output Tokens**: How many tokens agents generated
- **Total Cost**: Real dollars spent

**Pricing per 1M tokens:**
- Claude Opus: $15 input, $75 output
- Claude Haiku: $0.80 input, $4 output
- Local models: Free ($0)

### 📈 Activity
**Message history with timestamps**
View the 100 most recent agent actions:
- Timestamp of the action
- Which agent ran it
- The session it ran in
- Type of interaction (direct/group)
- Tokens used in that action

### ⏱️ Heartbeats
**Scheduled agent runs**
See which agents have cron jobs:
- Which agents have heartbeats enabled
- How often they run
- Is it currently active or disabled
- Default agent for scheduled tasks

## What Data Is Real-Time?

✅ **Real-time (refreshes every 30 sec):**
- Agent status
- Token counts
- Cost calculations
- Activity log
- Heartbeat settings

✅ **From actual files:**
- `~/.openclaw/openclaw.json` - Config & defaults
- `~/.openclaw/agents/*/sessions/*.jsonl` - Chat history
- `openclaw status --json` - Live session data

✅ **Smart calculations:**
- Status determined by last activity timestamp
- Costs calculated from actual token counts
- Models detected from actual running sessions

## Behind the Scenes

```
Portal → Command Center Page
  ↓
  ├→ /api/command-center/agents
  │   └→ openclaw.json + openclaw status --json
  │       → Agent status, tokens, models
  │
  ├→ /api/command-center/sessions
  │   └→ ~/.openclaw/agents/*/sessions/*.jsonl
  │       → Recent chat messages
  │
  └→ /api/command-center/usage
      └→ openclaw status --json
          → Cost calculations, activity, heartbeats
```

## Customization

Want to change something? Here are the key settings:

### Refresh Rate
**File**: `components/pages/CommandCenterPage.tsx`
**Line**: `const interval = setInterval(fetchData, 30000)`
**Change**: `30000` = milliseconds (30 seconds). Change to `60000` for 1 minute, etc.

### Pricing for Custom Models
**File**: `lib/command-center.ts`
**Search**: `const PRICING = {`
**Example**: Add a new model:
```typescript
'mymodel/model-name': {
  input: 0.5,
  output: 2.0,
}
```

### Message Limit
**File**: `lib/command-center.ts`
**Search**: `return allMessages.slice(0, 200)`
**Change**: `200` to any number (higher = slower but more history)

### Agent Status Thresholds
**File**: `lib/command-center.ts`
**Search**: `const minutesSinceActivity`
- Change `5` for "online" threshold
- Change `60` for "idle" threshold

## Troubleshooting

### "Command Center" option not showing in sidebar?
→ Clear browser cache (Cmd+Shift+R or Ctrl+Shift+F5)

### No agents showing up?
→ Make sure you have agents configured: `openclaw status`

### Costs show $0?
→ Normal if you're only using local models (they're free!)

### Data not updating?
→ Check that `openclaw status --json` works in terminal
→ Verify session files exist: `ls ~/.openclaw/agents/main/sessions/`

### Port 3000 already in use?
→ Kill existing process: `lsof -ti:3000 | xargs kill -9`
→ Or use different port: `npm run dev -- -p 3001`

## Pro Tips

1. **Bookmark the Command Center**: It's now your agent control hub
2. **Monitor costs regularly**: Check the Usage tab weekly
3. **Check heartbeats**: Make sure cron jobs are actually running (Activity tab)
4. **Agent health**: Keep an eye on the Dashboard—too many offline agents might indicate problems

## Architecture

The Command Center is built on:
- **Next.js 14** for the framework
- **React 18** for UI components
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **Lucide React** for icons

All data is fetched server-side using Node.js APIs that read OpenClaw's actual configuration and runtime state.

## Questions?

Check the detailed docs: `COMMAND_CENTER_IMPLEMENTATION.md`

---

**Happy monitoring!** 🚀
