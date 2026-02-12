# Cloud Employee Portal - Complete Setup Guide

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher ([download](https://nodejs.org))
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **GitHub Account**: For repository hosting
- **Vercel Account**: For deployment ([vercel.com](https://vercel.com))
- **Supabase Account**: For database ([supabase.com](https://supabase.com))

## 🔍 Verify Your Setup

```bash
node --version      # Should be v18+
npm --version       # Should be v8+
git --version       # Should be installed
```

## 🚀 Step 1: Initial Setup

### 1.1 Clone or Navigate to Project

```bash
cd /Users/michaelcopeland/.openclaw/workspace/portal-app
```

### 1.2 Install Dependencies

```bash
npm install
```

Expected output:
```
added 137 packages, and audited 138 packages
```

### 1.3 Verify Installation

```bash
npm list next react react-dom
```

## 🔐 Step 2: Set Up Supabase (Optional for Local Dev)

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose:
   - Organization: Create or select
   - Project Name: "cloud-employee-portal"
   - Database Password: Save securely
   - Region: Choose closest to you
5. Wait for project creation (~2 minutes)

### 2.2 Get Your Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **Anon Key** (under "Project API keys")

### 2.3 Configure Environment Variables

```bash
# Create local environment file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Update these values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_OPENROUTER_KEY=optional_key
```

### 2.4 Set Up Database (Optional)

Run this SQL in Supabase SQL Editor:

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

## 🧪 Step 3: Run Locally

### 3.1 Start Development Server

```bash
npm run dev
```

Expected output:
```
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2s
```

### 3.2 Open in Browser

Navigate to: [http://localhost:3000](http://localhost:3000)

### 3.3 Test Features

1. **Login Page**
   - Create account with email/password
   - Note: Requires Supabase for real auth

2. **Dashboard**
   - Overview: Summary cards
   - Agent Builder: Create agents
   - Chat: Send messages
   - Kanban: Drag tasks
   - LLM Config: Edit agent settings
   - Usage: View metrics

3. **Stop Server**
   ```bash
   Ctrl + C
   ```

## 🚢 Step 4: Prepare for Deployment

### 4.1 Build for Production

```bash
npm run build
```

Expected: `.next` folder created successfully

### 4.2 Test Production Build

```bash
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) again to verify.

### 4.3 Set Up Git Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Cloud Employee Portal MVP"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/portal-app.git
git branch -M main
git push -u origin main
```

## 📱 Step 5: Deploy to Vercel

### 5.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 5.2 Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import GitHub repository
4. Click "Import"
5. Configure:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_OPENROUTER_KEY=...
   NEXT_PUBLIC_APP_NAME=Cloud Employee Portal
   ```
7. Click "Deploy"

### 5.3 Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

## ✅ Deployment Verification

After deployment:

1. **Access Your App**
   - Get URL from Vercel dashboard
   - Visit in browser

2. **Test Features**
   - Login works
   - Dashboard loads
   - All tabs functional

3. **Check Logs**
   - Vercel Dashboard → Deployments → Logs
   - Monitor for errors

## 📊 Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Supabase anon key |
| `NEXT_PUBLIC_OPENROUTER_KEY` | No | OpenRouter API key |
| `NEXT_PUBLIC_APP_NAME` | No | App display name |

*Required for auth features; optional for UI-only testing

## 🔧 Troubleshooting

### Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Type check
npm run type-check

# Full rebuild
rm -rf .next
npm run build
```

### Runtime Errors

1. Check browser console: `F12` → Console
2. Check terminal for error messages
3. Review .env.local configuration

## 📚 File Locations

- **Source Code**: `/app`, `/components`, `/lib`
- **Configuration**: `next.config.js`, `tsconfig.json`, `tailwind.config.js`
- **Environment**: `.env.local`
- **Database**: Supabase (cloud-based)
- **Deployment**: Vercel (auto-deployed from GitHub)

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Getting Help

1. **Documentation**: See README.md, QUICKSTART.md
2. **Error Messages**: Read carefully, search online
3. **Community**: Next.js Discord, Supabase community
4. **Issues**: GitHub Issues tab

## ✨ Next Steps

1. ✅ Complete this setup
2. ✅ Test locally
3. ✅ Deploy to Vercel
4. ✅ Share deployment URL
5. 📋 Add features from Phase 2
6. 📈 Scale and monitor

You're all set! Happy building! 🚀
