# Cloud Employee Portal

A modern agent management and collaboration platform built with Next.js, React, and Tailwind CSS. Designed to match Assistable-v2 design standards.

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Features

### 🤖 Agent Management
- Create main and sub-agents
- Configure LLM models (GPT-4, Claude, Llama, etc.)
- Set safety constraints
- Assign roles and prompts
- Active/inactive status management

### 📋 Task Management
- **Kanban Board**: Organize tasks in 4 columns (To-Do → Doing → Stuck → Done)
- **Calendar View**: Monthly view of scheduled tasks
- Recurring tasks (Daily, Weekly, Monthly, Yearly)
- Task filtering and search
- Priority levels and due dates
- Agent assignment to tasks

### 💬 Chat & Collaboration
- Slack-style threaded conversations
- @mention agents within messages
- Multiple parallel conversations
- Unread message indicators
- Real-time message updates
- Search across conversations

## Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks

### File Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx            # Main dashboard
│   ├── globals.css         # Global styles
│   └── api/                # API routes (stubs)
├── components/
│   ├── Sidebar.tsx         # Main navigation
│   ├── AgentForm.tsx       # Agent creation/edit
│   ├── AgentCard.tsx       # Agent display
│   ├── KanbanBoard.tsx     # Kanban board
│   ├── CalendarView.tsx    # Calendar display
│   ├── TaskFilters.tsx     # Task filters
│   ├── ChatThread.tsx      # Chat interface
│   └── pages/
│       ├── AgentsPage.tsx      # Agent management
│       ├── TasksPage.tsx       # Task management
│       └── ChatPage.tsx        # Chat interface
├── lib/
│   ├── utils.ts            # Utility functions
│   └── db/
│       └── supabase.ts     # Auth stubs
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Design System

The application matches the Assistable-v2 design system with:

- **Color Palette**: Light backgrounds with dark text
- **Typography**: System font stack with proper hierarchy
- **Spacing**: Consistent 4px-based spacing scale
- **Components**: Reusable button, card, and form components
- **Icons**: Lucide React icons throughout

## Development

### Available Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## State Management

The application uses React hooks for state management:
- `useState` for component state
- Custom hooks for shared logic
- No external state management needed for MVP

## Data Model

### Agent
```typescript
interface Agent {
  id: string
  name: string
  type: 'main' | 'sub'
  llm: string
  status: 'active' | 'inactive'
  description: string
  constraints: string[]
  role: string
}
```

### Task
```typescript
interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'doing' | 'stuck' | 'done'
  assignedAgent: string
  dueDate: string
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  scheduled: boolean
  priority: 'low' | 'medium' | 'high'
}
```

### Message
```typescript
interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  mentions: string[]
}
```

## Future Enhancements

- Backend API integration
- WebSocket support for real-time updates
- Database persistence
- User authentication
- File uploads
- Advanced task scheduling
- Performance analytics
- Agent activity logs

## Notes

- Authentication is handled externally by createassistants.com
- No database required for MVP (mock data only)
- All features are implemented client-side
- Ready for backend integration

## License

MIT

## Author

Built as part of Assistable platform ecosystem.
