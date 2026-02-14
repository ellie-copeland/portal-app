'use client'

import { useState, useEffect } from 'react'
import { Crown, Mail, MoreHorizontal, Plus, Shield, Trash2, User, UserCheck, UserPlus, AlertCircle, Loader, Copy, Check } from 'lucide-react'

interface TeamMember {
  id: string
  user: {
    name: string | null
    email: string
    avatarUrl: string | null
  }
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
}

interface TeamData {
  id: string
  name: string
  members: TeamMember[]
  _count: {
    members: number
    agents: number
  }
}

interface PendingInvitation {
  id: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  status: string
  createdAt: string
  expiresAt: string
}

const roleConfig = {
  OWNER: { label: 'Owner', icon: Crown, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200' },
  ADMIN: { label: 'Admin', icon: Crown, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200' },
  MEMBER: { label: 'Member', icon: Shield, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200' },
  VIEWER: { label: 'Viewer', icon: User, color: 'bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200' },
}

export default function TeamPage() {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [copiedInviteId, setCopiedInviteId] = useState('')

  // Load team and members
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true)
        
        // Get the active team ID from localStorage
        const activeTeamId = localStorage.getItem('activeTeamId')
        if (!activeTeamId) {
          console.error('No active team selected')
          return
        }

        const response = await fetch(`/api/teams/${activeTeamId}`)
        if (response.ok) {
          const data = await response.json()
          setTeamData(data)

          // Load pending invitations
          const invitesResponse = await fetch(`/api/teams/${activeTeamId}/invite`)
          if (invitesResponse.ok) {
            const invites = await invitesResponse.json()
            setPendingInvitations(invites)
          }
        } else {
          console.error('Failed to load team data')
        }
      } catch (error) {
        console.error('Error loading team data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeamData()
  }, [])

  const handleInvite = async () => {
    if (!inviteEmail || !teamData) return

    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const response = await fetch(`/api/teams/${teamData.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        const invitation = await response.json()
        setPendingInvitations([
          {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          ...pendingInvitations,
        ])
        setInviteSuccess(`Invitation sent to ${inviteEmail}`)
        setInviteEmail('')
        setTimeout(() => setInviteSuccess(''), 3000)
      } else {
        const error = await response.json()
        setInviteError(error.error || 'Failed to send invitation')
      }
    } catch (error) {
      setInviteError('An error occurred. Please try again.')
      console.error('Error:', error)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCopyInviteLink = (inviteId: string, teamId: string) => {
    // In a real scenario, we'd have the actual invite token
    // For now, we'll show a placeholder
    const inviteLink = `${window.location.origin}/invite/${inviteId}`
    navigator.clipboard.writeText(inviteLink)
    setCopiedInviteId(inviteId)
    setTimeout(() => setCopiedInviteId(''), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-foreground font-medium">Failed to load team</p>
          <p className="text-muted-foreground text-sm">Please refresh the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{teamData.name}</h1>
            <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
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
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Team Size</p>
            <p className="text-2xl font-bold text-foreground">{teamData._count.members}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Agents</p>
            <p className="text-2xl font-bold text-foreground">{teamData._count.agents}</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-100 dark:border-sky-800">
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Admins</p>
            <p className="text-2xl font-bold text-foreground">
              {teamData.members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending Invites</p>
            <p className="text-2xl font-bold text-foreground">{pendingInvitations.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {/* Invite form */}
        {showInvite && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-3">Invite a team member</h3>
            
            {inviteError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {inviteSuccess}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="email@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                disabled={inviteLoading}
                className="flex-1 px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                disabled={inviteLoading}
                className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm disabled:opacity-50"
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {inviteLoading && <Loader className="w-4 h-4 animate-spin" />}
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <strong>Admin:</strong> Full access · <strong>Member:</strong> Create/manage assigned agents · <strong>Viewer:</strong> Read-only
            </div>
          </div>
        )}

        {/* Team members table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">Active Members</h2>
          </div>
          <div className="divide-y divide-border/50">
            {teamData.members.map(member => {
              const role = roleConfig[member.role]
              const RoleIcon = role.icon
              return (
                <div key={member.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-teal-400 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {member.user.name
                      ? member.user.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                      : member.user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.user.name || member.user.email}</p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${role.color} flex items-center gap-1`}>
                      <RoleIcon className="w-3 h-3" />
                      {role.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
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
        {pendingInvitations.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground">Pending Invites</h2>
            </div>
            <div className="divide-y divide-border/50">
              {pendingInvitations.map((invite) => {
                const role = roleConfig[invite.role]
                const RoleIcon = role.icon
                const isExpiring = new Date(invite.expiresAt).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                
                return (
                  <div key={invite.id} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(invite.createdAt).toLocaleDateString()} · 
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ml-1 inline-block ${role.color}`}>
                            <RoleIcon className="w-3 h-3 inline mr-1" />
                            {role.label}
                          </span>
                          {isExpiring && <span className="text-amber-600 dark:text-amber-400 ml-2">Expires soon</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyInviteLink(invite.id, teamData.id)}
                        className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        {copiedInviteId === invite.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                      <button className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        Revoke
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
