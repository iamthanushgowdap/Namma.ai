'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Verify that the user is logged in (via recovery session)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // If there's no active recovery session (e.g. they visited the URL manually without clicking reset link)
        setError('No active reset session found. Please request a new password reset link.')
      }
    }
    checkSession()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password
      })

      if (updateErr) throw updateErr

      setSuccess('Your password has been successfully updated!')
      setTimeout(() => {
        router.push('/dashboard/automations')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12 overflow-hidden transition-colors duration-150">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/3 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/AutoEngageai_logo.png" alt="AutoEngage" className="h-16 w-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">AutoEngage</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Create New Password</p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel rounded-2xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800/80">
          
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/35 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/35 flex items-start gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="confirmNewPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="confirmNewPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || error !== null && !success}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 cursor-pointer mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
