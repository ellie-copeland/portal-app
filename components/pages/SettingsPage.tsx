'use client'

import { useState } from 'react'
import { Camera, Key, Bell, Globe, Shield, Save } from 'lucide-react'
import LLMKeyManager from '@/components/LLMKeyManager'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, notifications, and preferences</p>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-2xl space-y-8">
          {/* Profile */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-purple-500" /> Profile</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-teal-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold">U</div>
              <button className="text-sm text-primary font-medium hover:underline">Change avatar</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                <input type="text" defaultValue="Brady Miller" className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                <input type="email" defaultValue="brady@assistable.ai" className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Role</label>
                <input type="text" defaultValue="Owner / Engineering Lead" className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Company</label>
                <input type="text" defaultValue="Assistable.ai" className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-purple-500" /> Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Critical alerts', desc: 'Sentry errors, system failures', defaultChecked: true },
                { label: 'Pending approvals', desc: 'AI actions waiting for review', defaultChecked: true },
                { label: 'Agent activity', desc: 'Execution completions and status changes', defaultChecked: false },
                { label: 'Weekly digest', desc: 'Summary of agent performance and costs', defaultChecked: true },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="w-5 h-5 accent-purple-600 rounded" />
                </label>
              ))}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Delivery channel</label>
                <select className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Slack + In-app</option>
                  <option>Email + In-app</option>
                  <option>In-app only</option>
                </select>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-purple-500" /> Preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Timezone</label>
                <select className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm">
                  <option>America/Denver (MST)</option>
                  <option>America/New_York (EST)</option>
                  <option>America/Los_Angeles (PST)</option>
                  <option>Europe/London (GMT)</option>
                  <option>Asia/Kolkata (IST)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Language</label>
                <select className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </section>

          {/* LLM API Keys */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-purple-500" /> LLM API Keys</h2>
            <p className="text-sm text-muted-foreground mb-6">Manage API keys for your AI providers (OpenRouter, Anthropic, OpenAI).</p>
            <LLMKeyManager />
          </section>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {saved ? <><Save className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
