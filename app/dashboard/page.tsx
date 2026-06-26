'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import {
  Instagram,
  Cpu,
  MessageSquare,
  Activity,
  ArrowRight,
  Zap,
  TrendingUp,
  MessageCircle,
} from 'lucide-react'

export default function DashboardOverviewPage() {
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const [stats, setStats] = useState({
    connectionsCount: 0,
    automationsCount: 0,
    conversationsCount: 0,
    messagesCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [connectedAccount, setConnectedAccount] = useState<any | null>(null)
  const [recentEvents, setRecentEvents] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (!activeWorkspace) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const workspaceId = activeWorkspace.id

        // 1. Fetch Instagram connection details
        const { data: accounts } = await supabase
          .from('instagram_accounts')
          .select('*')
          .eq('workspace_id', workspaceId)

        const account = accounts && accounts.length > 0 ? accounts[0] : null
        setConnectedAccount(account)

        // 2. Fetch automations count
        const { count: autoCount } = await supabase
          .from('automations')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)

        // 3. Fetch conversations count
        const { count: convCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)

        // 4. Fetch total messages count
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', supabase
            .from('conversations')
            .select('id')
            .eq('workspace_id', workspaceId)
          )

        setStats({
          connectionsCount: accounts?.length || 0,
          automationsCount: autoCount || 0,
          conversationsCount: convCount || 0,
          messagesCount: msgCount || 0,
        })

        // 5. Fetch recent webhook events
        const { data: events } = await supabase
          .from('webhook_events')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentEvents(events || [])
      } catch (err) {
        console.error('Error fetching dashboard overview data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeWorkspace])

  if (workspaceLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm text-zinc-400">Loading overview...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Monitor your Instagram automation metrics and inbox in real-time.
        </p>
      </div>

      {/* Connection Warning Alert */}
      {!connectedAccount && (
        <div className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-6 shadow-lg shadow-indigo-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 shrink-0 border border-indigo-500/20">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Connect your Instagram Business Account</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">
                  You need to connect an Instagram Account linked to a Facebook Page to start deploying AI responses and DMs.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/connections"
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/15 cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              Get Connected
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Grid Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Conversations</span>
            <MessageCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.conversationsCount}</span>
            <span className="text-[10px] text-zinc-500 font-medium">active threads</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Messages</span>
            <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.messagesCount}</span>
            <span className="text-[10px] text-zinc-500 font-medium">exchanged DMs</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active Automations</span>
            <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.automationsCount}</span>
            <span className="text-[10px] text-zinc-500 font-medium">rules deployed</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Integrations</span>
            <Instagram className="w-4 h-4 text-pink-500 dark:text-pink-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">
              {stats.connectionsCount > 0 ? 'Linked' : 'None'}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              {stats.connectionsCount > 0 ? `@${connectedAccount?.username}` : 'Instagram Account'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Section Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection Status Detail */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-zinc-200 dark:border-zinc-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Automation Engine Status
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              connectedAccount ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30'
            }`}>
              {connectedAccount ? 'Online' : 'Offline'}
            </span>
          </div>

          {connectedAccount ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-semibold border border-zinc-200 dark:border-indigo-500/20">
                  {connectedAccount.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">@{connectedAccount.username}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Connected ID: {connectedAccount.instagram_user_id}</p>
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">Connected {new Date(connectedAccount.connected_at).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/dashboard/automations"
                  className="flex flex-col items-center justify-center p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800/60 rounded-lg text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/20 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors group cursor-pointer"
                >
                  <Cpu className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-semibold mt-2 text-zinc-700 dark:text-zinc-300">Create Trigger Rules</span>
                  <span className="text-[10px] text-zinc-500 mt-1">Comments & DMs</span>
                </Link>
                <Link
                  href="/dashboard/inbox"
                  className="flex flex-col items-center justify-center p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800/60 rounded-lg text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/20 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors group cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-650 dark:group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-semibold mt-2 text-zinc-700 dark:text-zinc-300">Open Live Inbox</span>
                  <span className="text-[10px] text-zinc-500 mt-1">Real-time chats</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              <Instagram className="w-8 h-8 text-zinc-450 dark:text-zinc-600 mb-3" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                No active connection. Connect your Instagram account via the Connections tab to start listening for webhook triggers and comments.
              </p>
            </div>
          )}
        </div>

        {/* Recent Webhook Events */}
        <div className="glass-panel rounded-xl p-6 border border-zinc-200 dark:border-zinc-800/80 flex flex-col">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4 shrink-0">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Recent Webhook Events
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {recentEvents.length > 0 ? (
              recentEvents.map((evt) => (
                <div key={evt.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800/40 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                      {evt.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-zinc-500 font-medium">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                    {evt.event_type === 'comment_received'
                      ? `"${evt.payload?.text || 'No comment text'}" by ${evt.payload?.from?.username || 'user'}`
                      : `Message: "${evt.payload?.message?.text || 'No text'}"`
                    }
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <span className="text-[10px] text-zinc-500">No events logged yet.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
