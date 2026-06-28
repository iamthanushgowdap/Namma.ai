'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, ArrowRight, Activity } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  const [isReferralReadOnly, setIsReferralReadOnly] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref') || params.get('code') || params.get('referral')
      if (ref) {
        setReferralCodeInput(ref.trim())
        setIsReferralReadOnly(true)
        setMode('signup') // Automatically switch to sign-up mode if coming via referral link
      }
    }
  }, [])

  const handleAuth = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        
        window.location.href = '/dashboard'
      } else {
        if (!username || username.trim().length < 3) {
          throw new Error('Username must be at least 3 characters long.')
        }

        // Check username availability
        const checkRes = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.trim())}`)
        const checkData = await checkRes.json()
        if (checkData.error || !checkData.available) {
          throw new Error(checkData.error || 'This username has already been taken.')
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
              username: username.toLowerCase().trim(),
              referral_code_input: referralCodeInput.trim() || null,
            },
          },
        })
        if (signUpError) throw signUpError
        
        setMessage('Check your email to confirm your account, or try logging in if email confirmation is disabled.')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12 overflow-hidden transition-colors duration-150">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/3 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/Nammaai_logo.png" alt="Namma.ai" className="h-16 w-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Namma.ai</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Instagram AI Automation & DM Inbox</p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel rounded-2xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800/80">
          
          {/* Tab Selector */}
          <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/40 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                  : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                  : 'text-zinc-555 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/35">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/35">
                {message}
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <User className="w-4 h-4 text-[#B41DE6]" />
                    </span>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase())}
                      placeholder="username"
                      className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-tight">
                    Only lowercase letters, numbers, underscores, and periods.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="referralCode">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => !isReferralReadOnly && setReferralCodeInput(e.target.value)}
                    disabled={isReferralReadOnly}
                    placeholder="e.g., john1234"
                    className={`glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                      isReferralReadOnly ? 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-80' : ''
                    }`}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleAuth()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 cursor-pointer mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-500 mt-6 px-4">
          By signing in, you agree to our{' '}
          <Link href="/legal/terms" className="font-bold text-zinc-800 dark:text-zinc-200 hover:text-[#B41DE6] dark:hover:text-[#d97aff] transition-colors underline decoration-zinc-300 dark:decoration-zinc-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="font-bold text-zinc-800 dark:text-zinc-200 hover:text-[#B41DE6] dark:hover:text-[#d97aff] transition-colors underline decoration-zinc-300 dark:decoration-zinc-700">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  )
}
