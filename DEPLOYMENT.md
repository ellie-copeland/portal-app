# Deployment Guide

## Quick Start: Deploy to Vercel

### Step 1: Set Up GitHub Repository

```bash
cd /Users/michaelcopeland/.openclaw/workspace/portal-app

# If not already initialized
git remote add origin https://github.com/YOUR_USERNAME/portal-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /Users/michaelcopeland/.openclaw/workspace/portal-app
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel

When deploying, Vercel will prompt you to add environment variables. Set:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_OPENROUTER_KEY=your_openrouter_key_here (optional)
NEXT_PUBLIC_APP_NAME=Cloud Employee Portal
```

### Step 4: Vercel Dashboard Setup (Alternative)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select the GitHub repository
4. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
5. Add environment variables in "Environment Variables" section
6. Click "Deploy"

## Environment Variables

### For Local Development

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local with your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_OPENROUTER_KEY=your_key_here
NEXT_PUBLIC_APP_NAME=Cloud Employee Portal
```

### For Vercel Deployment

Set these in Vercel Project Settings → Environment Variables:
- All values from .env.example
- Keep the NEXT_PUBLIC_ prefix

## Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → anon (public) key
4. Add to environment variables

### Database Schema (SQL)

```sql
-- Create workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces,
  name TEXT NOT NULL,
  description TEXT,
  parent_agent_id UUID REFERENCES agents,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_configs table
CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents,
  model TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  context_window INTEGER DEFAULT 8000,
  system_prompt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces,
  agent_id UUID REFERENCES agents,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'doing', 'stuck')),
  assigned_to UUID REFERENCES users,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usage_metrics table
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces,
  agent_id UUID REFERENCES agents,
  tokens_used INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing the Deployment

1. Visit your Vercel deployment URL
2. Create an account (email/password)
3. Check all features:
   - Agent Builder works
   - Chat messages send
   - Kanban board tasks drag
   - LLM config saves
   - Usage dashboard displays data
   - Workspace selector switches

## Troubleshooting

### Build Fails
- Check Node version: `node --version` (should be 18+)
- Clear cache: `npm run clean` (if script exists) or `rm -rf .next node_modules && npm install`
- Check for TypeScript errors: `npm run build`

### Environment Variables Not Working
- Verify variables are set in Vercel Dashboard
- Check for NEXT_PUBLIC_ prefix for client-side variables
- Redeploy after updating environment variables

### Supabase Connection Issues
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
- Ensure Supabase project is active

## Post-Deployment

1. **Monitor** - Check Vercel Analytics dashboard
2. **Logs** - View build and runtime logs in Vercel
3. **Performance** - Use Web Vitals monitoring
4. **Updates** - Push to GitHub, Vercel auto-deploys on main branch

## Rollback

To rollback to a previous deployment:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find the previous successful deployment
4. Click "..." and select "Promote to Production"
