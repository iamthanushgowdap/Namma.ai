'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import { User, Folder, Save, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const { activeWorkspace } = useWorkspace()
  const router = useRouter()
  
  const [profileName, setProfileName] = useState('')
  const [profileUsername, setProfileUsername] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saveProfileLoading, setSaveProfileLoading] = useState(false)
  const [saveWorkspaceLoading, setSaveWorkspaceLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Get current authenticated user details
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User session not found')
      }
      setUserEmail(user.email || '')
      setOriginalEmail(user.email || '')

      // 2. Fetch profile details
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileErr) throw profileErr

      if (profile) {
        setProfileName(profile.name || '')
        setProfileUsername(profile.username || '')
        setCurrentUsername(profile.username || '')
      }

      // 3. Set workspace name details
      if (activeWorkspace) {
        setWorkspaceName(activeWorkspace.name || '')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [activeWorkspace])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveProfileLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User session not found')

      const cleanUsername = profileUsername.trim().toLowerCase()

      // 1. Username validation & availability check (only if username has changed)
      if (cleanUsername !== currentUsername) {
        if (cleanUsername.length < 3 || cleanUsername.length > 30) {
          throw new Error('Username must be between 3 and 30 characters.')
        }
        const usernameRegex = /^[a-zA-Z0-9_.]+$/
        if (!usernameRegex.test(cleanUsername)) {
          throw new Error('Username can only contain lowercase letters, numbers, underscores, and periods.')
        }

        const checkRes = await fetch(`/api/auth/check-username?username=${encodeURIComponent(cleanUsername)}`)
        const checkData = await checkRes.json()
        if (checkData.error || !checkData.available) {
          throw new Error(checkData.error || 'This username has already been taken.')
        }
      }

      // 2. Email verification & update (only if email has changed)
      const cleanEmail = userEmail.trim().toLowerCase()
      let emailChanged = cleanEmail !== originalEmail
      if (emailChanged) {
        if (!confirmPassword) {
          throw new Error('Current password is required to verify your identity before changing your email address.')
        }

        const updateEmailRes = await fetch('/api/auth/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail: cleanEmail, password: confirmPassword })
        })
        const updateEmailData = await updateEmailRes.json()
        if (updateEmailData.error) {
          throw new Error(updateEmailData.error)
        }
      }

      // 3. Update Profiles Table (Name + Username)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          name: profileName.trim(),
          username: cleanUsername,
        })
        .eq('id', user.id)

      if (updateErr) throw updateErr

      // Update baseline states on success
      setCurrentUsername(cleanUsername)
      setOriginalEmail(cleanEmail)
      setConfirmPassword('')

      setSuccess('Profile settings updated successfully.')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings')
    } finally {
      setSaveProfileLoading(false)
    }
  }

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace) return
    setSaveWorkspaceLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error: updateErr } = await supabase
        .from('workspaces')
        .update({ name: workspaceName })
        .eq('id', activeWorkspace.id)

      if (updateErr) throw updateErr

      setSuccess('Workspace settings updated successfully.')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace settings')
    } finally {
      setSaveWorkspaceLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to delete your account? This will permanently wipe your profile, active subscriptions, connected Instagram accounts, response configurations, and all message history. This action cannot be undone.')) {
      return
    }

    setDeleteLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      alert('Your account and all associated data have been permanently deleted.')
      window.location.href = '/login'
    } catch (err: any) {
      setError(err.message || 'An error occurred during account deletion')
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-200">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal profile, active workspaces, and security settings.
        </p>
      </div>

      {/* Notices */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-650 dark:text-red-400 text-xs rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/35 text-emerald-750 dark:text-emerald-400 text-xs rounded-xl">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Profile Settings Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-6">
          <User className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <h3 className="font-bold text-foreground text-sm">Personal Profile</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Username</label>
              <input
                type="text"
                required
                value={profileUsername}
                onChange={e => setProfileUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase())}
                placeholder="username"
                className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
              />
            </div>
          </div>

          {userEmail.trim().toLowerCase() !== originalEmail && (
            <div className="space-y-1.5 p-4 bg-amber-550/5 border border-amber-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-amber-600 dark:text-amber-450 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Current Password Required
              </label>
              <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                To update your email address, you must enter your current password to verify your identity. A confirmation link will be sent to the new email.
              </p>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
              />
            </div>
          )}


          <div className="border-t border-border/40 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saveProfileLoading}
              className="flex items-center gap-1.5 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-600/15 cursor-pointer"
            >
              {saveProfileLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Workspace Settings Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-6">
          <Folder className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <h3 className="font-bold text-foreground text-sm">Workspace Settings</h3>
        </div>

        <form onSubmit={handleSaveWorkspace} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Workspace Name</label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              placeholder="e.g. My Personal Brand"
              className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
            />
          </div>

          <div className="border-t border-border/40 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saveWorkspaceLoading}
              className="flex items-center gap-1.5 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-600/15 cursor-pointer"
            >
              {saveWorkspaceLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Danger Zone */}
      <div className="glass-panel border-red-500/20 dark:border-red-500/10 rounded-2xl p-6 relative overflow-hidden bg-red-50/5 dark:bg-red-950/5">
        <div className="flex items-center gap-2 border-b border-red-500/15 pb-4 mb-6">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-red-500 text-sm">Danger Zone</h3>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permanently delete your Namma.ai account. This will immediately disconnect your Instagram accounts, deactivate all active automations, clear your billing details, and permanently delete all data from our database.
          </p>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="flex items-center gap-1.5 py-2 px-4 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-sm cursor-pointer"
            >
              {deleteLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
