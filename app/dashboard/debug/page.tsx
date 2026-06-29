import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, CheckCircle, XCircle, Activity, Key, Globe, ArrowLeft, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Get user's primary workspace
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)

  const workspace = workspaces?.[0]
  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <XCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-100">No Workspace Found</h2>
        <p className="text-zinc-400 mt-2 max-w-md">You need an active workspace to view diagnostics.</p>
      </div>
    )
  }

  // 3. Fetch connected Instagram account
  const { data: igAccount } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('workspace_id', workspace.id)
    .single()

  // 4. Fetch webhook stats
  const { count: webhookCount } = await supabase
    .from('webhook_events')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)

  const { data: recentEvents } = await supabase
    .from('webhook_events')
    .select('id, event_type, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 5. Gather token meta if connected
  let tokenInfo: {
    isValid: boolean
    scopes: string[]
    expiresAt: string | null
    error?: string
  } = {
    isValid: false,
    scopes: [],
    expiresAt: null,
  }

  if (igAccount) {
    try {
      const token = decrypt(igAccount.access_token_encrypted)
      const appId = process.env.META_APP_ID
      const appSecret = process.env.META_APP_SECRET

      if (appId && appSecret) {
        const debugRes = await fetch(
          `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`
        )
        const debugData = await debugRes.json()

        if (debugData?.data) {
          tokenInfo = {
            isValid: debugData.data.is_valid === true,
            scopes: debugData.data.scopes || [],
            expiresAt: debugData.data.expires_at 
              ? new Date(debugData.data.expires_at * 1000).toLocaleString() 
              : 'Never (Long-Lived/Permanent)',
          }
        } else if (debugData?.error) {
          tokenInfo.error = debugData.error.message
        }
      } else {
        tokenInfo.error = 'META_APP_ID or META_APP_SECRET is not configured in environment.'
      }
    } catch (err: any) {
      tokenInfo.error = `Failed to decrypt or inspect token: ${err.message}`
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
            <Link href="/dashboard/connections" className="hover:text-zinc-200 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Connections
            </Link>
            <span>/</span>
            <span className="text-zinc-200">Diagnostics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Integration Diagnostics</h1>
          <p className="text-zinc-400 text-sm mt-1">Audit and verify your Instagram direct connection settings and webhook delivery status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard/debug"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Status Card */}
          <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-400" /> Connection Profile
            </h3>

            {!igAccount ? (
              <div className="flex flex-col items-center py-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <XCircle className="w-10 h-10 text-zinc-500 mb-2" />
                <p className="text-zinc-300 font-medium">No Instagram account connected</p>
                <p className="text-zinc-500 text-xs mt-1 max-w-sm">Please connect your professional account on the connections tab.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                    <span className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold">Username</span>
                    <span className="block text-lg font-bold text-white mt-1">@{igAccount.username}</span>
                  </div>
                  <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                    <span className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold">Instagram Business Account ID</span>
                    <span className="block text-lg font-mono font-bold text-zinc-300 mt-1 select-all">{igAccount.instagram_user_id}</span>
                  </div>
                </div>

                {/* Token Verification Status */}
                <div className="mt-6 border-t border-zinc-800/60 pt-6">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-400" /> Token Inspection
                  </h4>
                  {tokenInfo.error ? (
                    <div className="p-4 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-xl text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-500" /> Diagnostics Error
                      </p>
                      <p className="font-mono mt-1 opacity-90">{tokenInfo.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {tokenInfo.isValid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Token is Active & Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Token Expired/Invalid
                          </span>
                        )}
                        <span className="text-xs text-zinc-500 font-mono">Expires: {tokenInfo.expiresAt}</span>
                      </div>

                      {/* Scopes Grid */}
                      <div>
                        <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Granted Scopes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tokenInfo.scopes.length === 0 ? (
                            <span className="text-xs text-zinc-500 italic">No scopes returned</span>
                          ) : (
                            tokenInfo.scopes.map((scope) => (
                              <span 
                                key={scope} 
                                className="px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded"
                              >
                                {scope}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Webhook Logs Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-purple-400" /> Recent Webhook Deliveries
            </h3>

            {(!recentEvents || recentEvents.length === 0) ? (
              <div className="flex flex-col items-center py-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <Globe className="w-10 h-10 text-zinc-500 mb-2" />
                <p className="text-zinc-300 font-medium">No webhook events received yet</p>
                <p className="text-zinc-500 text-xs mt-1 max-w-sm">Write a comment on your Instagram profile to test the delivery pipeline.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-hidden border border-zinc-800/60 rounded-xl bg-zinc-950/30">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-950/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Event Type</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {recentEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-zinc-900/20 transition">
                          <td className="px-4 py-3 text-sm font-mono font-medium text-purple-300">{event.event_type}</td>
                          <td className="px-4 py-3 text-right text-xs text-zinc-400">{new Date(event.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <span className="block text-right text-xs text-zinc-500">Showing last 5 events</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Stats Summary */}
        <div className="space-y-6">
          {/* Webhook Stat Summary */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Pipeline Stats</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Webhooks Processed</span>
                <span className="block text-3xl font-extrabold text-white mt-1">{webhookCount || 0}</span>
              </div>
              <div className="border-t border-zinc-800/60 pt-4">
                <span className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold">Connection Status</span>
                <span className="block mt-2">
                  {igAccount ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 rounded-full">
                      DISCONNECTED
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-purple-950/20 to-zinc-900 border border-purple-900/30 rounded-2xl p-6">
            <h3 className="text-zinc-200 font-bold mb-2">How to test webhooks?</h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              To trigger a webhook delivery test, use an Instagram account that is **not** your business account, go to one of your posts on `@shubhkiranvlogs`, and write a comment matching one of your active triggers.
            </p>
            <div className="text-xs text-purple-300 font-medium">
              Check out connections settings to verify your webhook subscription configurations.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
