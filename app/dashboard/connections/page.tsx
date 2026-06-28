'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import { Instagram, Link2, Trash2, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'

export default function ConnectionsPage() {
  const { activeWorkspace } = useWorkspace()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [account, setAccount] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Check URL parameters for OAuth responses
    const successParam = searchParams.get('success')
    const countParam = searchParams.get('count')
    const errorParam = searchParams.get('error')

    if (successParam === 'true') {
      setSuccess(`Successfully connected ${countParam || 1} Instagram Business Account(s)!`)
      // Clear URL params
      router.replace('/dashboard/connections')
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam))
      // Clear URL params
      router.replace('/dashboard/connections')
    }
  }, [searchParams])

  const fetchConnectedAccount = async () => {
    if (!activeWorkspace) return
    setLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)

      if (dbError) throw dbError
      
      setAccount(data && data.length > 0 ? data[0] : null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch connected accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnectedAccount()
  }, [activeWorkspace])

  const handleConnect = () => {
    setActionLoading(true)
    // Redirect browser to the local OAuth initiation route
    window.location.href = '/api/auth/instagram'
  }

  const handleDisconnect = async () => {
    if (!activeWorkspace || !account) return
    if (!confirm('Are you sure you want to disconnect this Instagram account? All automation rules for this account will stop running.')) return

    setActionLoading(true)
    try {
      const { error: deleteError } = await supabase
        .from('instagram_accounts')
        .delete()
        .eq('id', account.id)

      if (deleteError) throw deleteError

      setAccount(null)
      setSuccess('Successfully disconnected Instagram account.')
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect account')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Checking connection status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Instagram Connection
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Securely link your Instagram Business Account using official Meta OAuth.
        </p>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs rounded-xl animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Connection Error</span>
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 text-emerald-750 dark:text-emerald-400 text-xs rounded-xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Success</span>
            {success}
          </div>
        </div>
      )}

      {/* Main Connection Layout Card */}
      <div className="glass-panel rounded-2xl p-8 max-w-2xl relative overflow-hidden">
        {account ? (
          /* CONNECTED STATE */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 border border-indigo-500/20 font-bold text-lg shadow-inner">
                  {account.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                    @{account.username}
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded-full font-semibold">
                      Connected
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Instagram Account ID: {account.instagram_user_id}</p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Disconnect Account
              </button>
            </div>

            {/* Connection Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Meta Graph Token</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Encrypted & Secured
                </span>
              </div>
              <div className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Connected At</span>
                <span className="text-xs font-medium text-foreground/90">
                  {new Date(account.connected_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted/30 border border-border/40 rounded-xl text-xs text-muted-foreground space-y-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Webhooks Subscription Status
              </span>
              <p>
                Your Facebook Page subscription is active. The platform is listening to <strong className="text-foreground font-semibold">comments, messages, and replies</strong> events. Any comment containing active trigger keywords will run the automation rules automatically.
              </p>
            </div>
          </div>
        ) : (
          /* DISCONNECTED STATE */
          <div className="space-y-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border shadow-inner">
                <Instagram className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-bold text-foreground">Connect with Instagram</h3>
                <p className="text-muted-foreground text-xs max-w-md">
                  Enable automated comment replies, message automation flows, and a unified DM inbox. Connect your Instagram Business account in seconds.
                </p>
              </div>
            </div>

            {/* Step-by-Step Connection Guidelines */}
            <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 text-left space-y-3">
              <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black">!</span>
                Step-by-Step Connection Guidelines
              </h4>
              <ol className="list-decimal pl-4 space-y-2 text-xs text-zinc-650 dark:text-zinc-350">
                <li>
                  First, open <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-500 hover:underline">instagram.com</a> in a Chrome, Safari, or whatever browser you are using right now.
                </li>
                <li>
                  Log in to your Instagram account in that browser tab, then come back to our page.
                </li>
                <li>
                  Then proceed to tap the <strong className="text-zinc-800 dark:text-white">Connect Instagram via Facebook</strong> button below.
                </li>
              </ol>
            </div>

            <div className="border-t border-border/60 pt-6">
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Connect Instagram via Facebook
                  </>
                )}
              </button>
            </div>

            {/* Integration instructions */}
            <div className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-3 text-left">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Connection Prerequisites
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-foreground">
                <li>Your Instagram Account must be converted to an <strong className="text-foreground font-semibold">Instagram Professional / Business Account</strong>.</li>
                <li>Your Instagram Business Account must be connected to a <strong className="text-foreground font-semibold">Facebook Page</strong> that you own.</li>
                <li>You must grant full permissions for <strong className="text-foreground font-semibold">messages, comments, and pages</strong> in the Meta popup.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
