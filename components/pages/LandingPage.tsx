'use client'

import { Bot, Zap, Shield, BarChart3, MessageSquare, Users, ArrowRight, Sparkles } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0a0f]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Portal</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all text-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            AI Agent Management Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Build, Deploy & Manage
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              AI Agents at Scale
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            The unified control plane for your AI workforce. Create agents, monitor performance,
            manage conversations, and scale your AI operations — all from one dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group px-8 py-3.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-base flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to manage AI agents</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From creation to monitoring, Portal gives you full control over your AI operations.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Bot, title: 'Agent Builder', desc: 'Create and configure AI agents with custom personas, models, and constraints. Support for OpenAI, Anthropic, and more.' },
            { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with your agents in real-time with streaming responses. Full conversation history and context management.' },
            { icon: BarChart3, title: 'Command Center', desc: 'Real-time dashboard with token usage, cost tracking, execution metrics, and agent performance analytics.' },
            { icon: Shield, title: 'Security & Teams', desc: 'Role-based access control, API key management, audit logs, and team collaboration built in.' },
            { icon: Zap, title: 'Task Automation', desc: 'Define tasks, trigger executions, and let your agents work autonomously with full observability.' },
            { icon: Users, title: 'Multi-Provider', desc: 'Bring your own API keys. Works with OpenAI, Anthropic, Google, Meta, Mistral, and OpenRouter.' },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                <feature.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 border border-white/[0.06]">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build your AI team?</h2>
          <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
            Sign up free and start deploying agents in minutes. No credit card required.
          </p>
          <button
            onClick={onGetStarted}
            className="group px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all text-base flex items-center gap-2 mx-auto"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-white/30">
          <span>© 2025 Portal. All rights reserved.</span>
          <span>Built with ❤️</span>
        </div>
      </footer>
    </div>
  )
}
