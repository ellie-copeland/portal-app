'use client'

import { useState } from 'react'
import { Crown, Mail, MoreHorizontal, Plus, Shield, Trash2, User, UserCheck, UserPlus } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  avatar: string
  status: 'active' | 'invited'
  lastActive: string
  agentAccess: string[]
}

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Mike Copeland', email: 'mike@assistable.ai', role: 'admin', avatar: 'MC', status: 'active', lastActive: 'Now (traveling)', agentAccess: ['All agents'] },
  { id: '2', name: 'Brady Miller', email: 'brady@assistable.ai', role: 'admin', avatar: 'BM', status: 'active', lastActive: 'Just now', agentAccess: ['All agents'] },
  { id: '3', name: 'Jorden Williams', email: 'jorden@assistable.ai', role: 'admin', avatar: 'JW', status: 'active', lastActive: '2 hours ago', agentAccess: ['All agents'] },
  { id: '4', name: 'Anish Kumar', email: 'anish@assistable.ai', role: 'member', avatar: 'AK', status: 'active', lastActive: '30 min ago', agentAccess: ['Code Reviewer', 'Sentry Monitor'] },
  { id: '5', name: 'Faith', email: 'faith@assistable.ai', role: 'member', avatar: 'F', status: 'active', lastActive: '15 min ago', agentAccess: ['All agents'] },
  { id: '6', name: 'dubs', email: 'dubs@assistable.ai', role: 'member', avatar: 'D', status: 'active', lastActive: '1 hour ago', agentAccess: ['Code Reviewer', 'Sentry Monitor', 'Sales Assistant'] },
]

const MOCK_INVITES = [
  { email: 'ahmad@assistable.ai', role: 'member', sentAt: '2 hours ago' },
  { email: 'shabbi@assistable.ai', role: 'viewer', sentAt: '1 day ago' },
]

const roleConfig = {
  admin: { label: 'Admin', icon: Crown, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200' },
  member: { label: 'Member', icon: Shield, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200' },
  viewer: { label: 'Viewer', icon: User, color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

export default function TeamPage() {
  const [team] = useState(MOCK_TEAM)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Team</h1>
            <p className="text-muted-foreground">Manage team members, roles, and agent permissions</p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 font-medium">Team Size</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{team.length}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <p className="text-xs text-teal-600 font-medium">Admins</p>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{team.filter(m => m.role === 'admin').length}</p>
          </div>
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <p className="text-xs text-sky-600 font-medium">Members</p>
            <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">{team.filter(m => m.role === 'member').length}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-amber-600 font-medium">Pending Invites</p>
            <p className="text-2xl font-bold text-amber-700">{MOCK_INVITES.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {/* Invite form */}
        {showInvite && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-3">Invite a team member</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="email@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
                Send Invite
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <strong>Admin:</strong> Full access · <strong>Member:</strong> Create/manage assigned agents · <strong>Viewer:</strong> Read-only
            </div>
          </div>
        )}

        {/* Team table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">Active Members</h2>
          </div>
          <div className="divide-y divide-border/50">
            {team.map(member => {
              const role = roleConfig[member.role]
              const RoleIcon = role.icon
              return (
                <div key={member.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-teal-400 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${role.color} flex items-center gap-1`}>
                      <RoleIcon className="w-3 h-3" />
                      {role.label}
                    </span>
                    <span className="text-xs text-muted-foreground w-24">{member.lastActive}</span>
                  </div>
                  <div className="hidden md:flex flex-wrap gap-1 max-w-48">
                    {member.agentAccess.map(a => (
                      <span key={a} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{a}</span>
                    ))}
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pending Invites */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">Pending Invites</h2>
          </div>
          <div className="divide-y divide-border/50">
            {MOCK_INVITES.map((invite, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">Sent {invite.sentAt} · Role: {invite.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:text-foreground">Resend</button>
                  <button className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
