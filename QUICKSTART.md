# Cloud Employee Portal - Quick Start Guide

## 🚀 Start Development Server (5 minutes)

```bash
cd /Users/michaelcopeland/.openclaw/workspace/portal-app

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Open in browser
# → http://localhost:3000
```

## 📋 Default Login Credentials

The app has a login page but uses Supabase Auth. For testing:

1. **Create an account**
   - Use any email
   - Create a password (minimum 6 characters)
   - Click "Sign Up" or "Create an account"

2. **Sign in**
   - Use the same email/password
   - Click "Sign In"

## 🎯 Key Features to Test

### 1. **Agent Builder** (Tab: Agent Builder)
- View hierarchical agent tree
- Click agents to select parent
- Add new agents with name and description
- See real-time hierarchy updates

### 2. **Chat Thread** (Tab: Chat)
- Type messages and press Send
- See messages appear in conversation
- Auto-scrolling chat history
- Simulated agent responses

### 3. **Kanban Board** (Tab: Kanban)
- Three columns: To-Do, Doing, Stuck
- Create new tasks with dropdown column selector
- Drag tasks between columns
- Tasks persist within columns

### 4. **LLM Config** (Tab: LLM Config)
- View 2 pre-configured agents
- Click "Edit" to customize:
  - Model selection (dropdown)
  - Temperature slider (0-1)
  - Context window (number)
  - System prompt (text area)
- Click "Save" to apply changes

### 5. **Usage Dashboard** (Tab: Usage)
- View total tokens, API calls, cost
- See agent-by-agent breakdown
- Summary statistics cards

### 6. **Workspace Selector** (Tab: Overview)
- Switch between workspaces
- View all available workspaces
- Create new workspace (button ready)

## 🔧 Configuration

### Local Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_OPENROUTER_KEY=optional_key
```

## 📦 Project Structure

```
portal-app/
├── app/
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Login page
│   └── globals.css        # Styles
├── components/            # React components
│   ├── AgentBuilder.tsx
│   ├── ChatThread.tsx
│   ├── KanbanBoard.tsx
│   ├── LLMConfig.tsx
│   ├── UsageDashboard.tsx
│   └── WorkspaceSelector.tsx
├── lib/
│   ├── db/               # Database & Auth
│   └── ...
└── package.json          # Dependencies
```

## 🧪 Testing Checklist

- [ ] Login page loads
- [ ] Create account works
- [ ] Sign in redirects to dashboard
- [ ] Dashboard tabs switch smoothly
- [ ] Agent Builder creates agents
- [ ] Chat sends messages
- [ ] Kanban tasks drag between columns
- [ ] LLM Config edits save
- [ ] Usage Dashboard loads metrics
- [ ] Workspace selector changes

## 🐛 Troubleshooting

### Port already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Dependencies not installed
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check for type issues
npm run type-check
```

### Build issues
```bash
# Rebuild from scratch
rm -rf .next
npm run build
```

## 📚 Next Steps

1. **Connect Supabase**
   - Create Supabase project
   - Update .env.local
   - Run database schema SQL

2. **Deploy to Vercel**
   - See DEPLOYMENT.md
   - Push to GitHub
   - Deploy from Vercel dashboard

3. **Add OpenRouter API**
   - Get API key from openrouter.ai
   - Add to environment variables
   - Implement LLM API calls

## 📞 Support

For issues:
1. Check console for errors: `F12` → Console tab
2. Check network tab for API issues
3. Review README.md for detailed docs
4. Check DEPLOYMENT.md for production setup

## ✨ What's Included

✅ Full Next.js 14 setup with TypeScript  
✅ TailwindCSS styling  
✅ Supabase Auth integration (ready to connect)  
✅ All 6 core features UI-complete  
✅ Responsive design  
✅ API route stubs for backend  
✅ Database schema provided  
✅ Deployment ready (Vercel)  

## 🎉 You're All Set!

The app is ready to use for development and testing. Start the dev server and explore all the features!

```bash
npm run dev
```

Happy coding! 🚀
