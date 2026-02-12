# Cloud Employee Portal MVP

A full-featured agent management and collaboration platform built with Next.js, React, TailwindCSS, and Supabase.

## Features

- **Agent Builder UI** - Create and manage hierarchical agent structures (master agents + sub-agents)
- **Unified Chat Thread** - Slack-style messaging with all agents in one view
- **Kanban Board** - Task management with To-Do/Doing/Stuck columns and drag-drop reordering
- **LLM Config Panel** - Per-agent model selection, temperature, and context window configuration
- **Workspace Selector** - Multi-tenant ready workspace switching
- **Usage Dashboard** - Token counts, API calls, and cost tracking
- **Authentication** - Secure email/password login with Supabase Auth

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **LLM Integration**: OpenRouter API
- **Language**: TypeScript + Zod for validation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ (v25.6.0 recommended)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/portal-app.git
   cd portal-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your actual values:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_OPENROUTER_KEY` - Your OpenRouter API key (optional for development)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **workspaces** - Multi-tenant workspace management
- **users** - User accounts with workspace association
- **agents** - Agent definitions with hierarchical relationships
- **agent_configs** - LLM configuration per agent (model, temperature, context)
- **chat_messages** - Unified chat messages across all agents
- **tasks** - Kanban board tasks with status tracking
- **usage_metrics** - API usage tracking and cost analysis

## Project Structure

```
portal-app/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Main dashboard page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Login/auth page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── AgentBuilder.tsx
│   ├── ChatThread.tsx
│   ├── KanbanBoard.tsx
│   ├── LLMConfig.tsx
│   ├── UsageDashboard.tsx
│   └── WorkspaceSelector.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts     # TypeScript interfaces
│   │   └── supabase.ts   # Supabase client setup
│   └── auth/
├── public/               # Static assets
└── package.json          # Dependencies
```

## Key Features in Detail

### Agent Builder
- Hierarchical tree view of agents
- Drag-and-drop agent creation
- Parent-child relationships
- Real-time updates

### Chat Thread
- Slack-style messaging interface
- Agent identification per message
- Timestamp tracking
- Auto-scroll to latest messages

### Kanban Board
- Three default columns: To-Do, Doing, Stuck
- Drag-and-drop task reordering between columns
- Task creation with descriptions
- Persistent state management

### LLM Configuration
- Per-agent model selection
- Temperature adjustment (0-1 scale)
- Context window configuration
- System prompt customization

### Usage Dashboard
- Real-time token tracking
- API call counters
- Cost calculation per agent
- Summary statistics

### Workspace Management
- Multi-tenant support
- Workspace switching
- Team collaboration
- Isolated data per workspace

## Authentication Flow

1. User signs up or logs in with email/password
2. Supabase Auth handles credential validation
3. Session maintained via Supabase client
4. Protected routes redirect to login if unauthenticated
5. User dashboard accessible after successful authentication

## Development Notes

- All components are client-side for MVP (add server-side later if needed)
- Styling uses TailwindCSS utility classes for fast iteration
- Placeholder data in components for immediate UI testing
- No external animation libraries - uses CSS for simplicity
- Ready for backend API integration

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/your-username/portal-app.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import the GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

3. **Environment Variables on Vercel**
   - Set the same variables from `.env.example`
   - Vercel will build and deploy automatically

## Next Steps / Phase 2

- Implement actual database operations with Supabase
- Add real OpenRouter API integration
- Real-time chat with Supabase subscriptions
- File upload support
- Agent execution logging
- Advanced analytics
- Webhook integrations

## License

MIT

## Support

For issues and questions, please open a GitHub issue or contact the development team.
