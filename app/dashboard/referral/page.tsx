'use client'

import { useEffect, useState } from 'react'
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react'

export default function ReferralDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // Link copy state
  const [copied, setCopied] = useState(false)

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/referral')
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load referral details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferralData()
  }, [])

  const copyToClipboard = () => {
    if (!data) return
    const url = `${window.location.origin}/login?ref=${data.referralCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Loading referral center...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Title & Description */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Refer &amp; Earn
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite your friends, share the benefits, and grow your audience automatically.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-955/40 border border-red-200 dark:border-red-900/35 text-red-800 dark:text-red-400 text-xs rounded-xl animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-955/35 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Referral Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Referral URL Card */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 dark:text-white text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-500" />
              Your Invitation Link
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Copy your unique link and share it on Instagram, email, or WhatsApp. 
              New members who register with your link get a <strong className="text-indigo-650 dark:text-indigo-400">15% discount</strong> on their first subscription, and you earn <strong className="text-indigo-650 dark:text-indigo-400">10% commission</strong> on their payment.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <div className="flex-1 px-4 py-2.5 bg-zinc-100/60 dark:bg-zinc-955/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-xs text-zinc-650 dark:text-zinc-350 truncate">
              {data ? `${window.location.origin}/login?ref=${data.referralCode}` : ''}
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/15"
            >
              {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Total stats card */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Referrals Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Signups</span>
              <p className="text-xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{data?.stats?.signups || 0}</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Paying Users</span>
              <p className="text-xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{data?.stats?.converted || 0}</p>
            </div>
          </div>
          {data?.stats?.converted < 2 ? (
            <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-450 leading-snug">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You need at least 2 active paying referrals (you currently have {data?.stats?.converted || 0}) to start cash withdrawals in your Wallet.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-455 font-semibold">
              <Check className="w-4 h-4" />
              <span>Withdrawals unlocked in Wallet!</span>
            </div>
          )}
        </div>
      </div>

      {/* Referred Friends List */}
      <div className="glass-panel rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 p-6 overflow-hidden">
        <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-4 flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-indigo-500" />
          Referred Accounts &amp; Status
        </h3>
        <div>
          {data?.referrals?.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="py-3 font-semibold w-1/3">User Details</th>
                      <th className="py-3 font-semibold w-1/3">Joined Date</th>
                      <th className="py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((entry: any) => {
                      const joinedDate = entry.referred?.created_at 
                        ? new Date(entry.referred.created_at).toLocaleDateString()
                        : new Date(entry.created_at).toLocaleDateString()
                      return (
                        <tr key={entry.id} className="border-b border-border/20 last:border-0 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="py-3.5">
                            <div className="font-semibold text-zinc-900 dark:text-white">{entry.referred?.name || 'User Signed Up'}</div>
                            <div className="text-muted-foreground text-[10px]">{entry.referred?.email || 'N/A'}</div>
                          </td>
                          <td className="py-3.5 text-zinc-550 dark:text-zinc-450">{joinedDate}</td>
                          <td className="py-3.5 text-right">
                            {entry.status === 'converted' ? (
                              <span className="inline-flex bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                Paying Customer
                              </span>
                            ) : entry.status === 'fraudulent' ? (
                              <span className="inline-flex bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                Flagged (Abuse)
                              </span>
                            ) : (
                              <span className="inline-flex bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                Joined (Free)
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-4">
                {data.referrals.map((entry: any) => {
                  const joinedDate = entry.referred?.created_at 
                    ? new Date(entry.referred.created_at).toLocaleDateString()
                    : new Date(entry.created_at).toLocaleDateString()
                  return (
                    <div key={entry.id} className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">{entry.referred?.name || 'User Signed Up'}</div>
                          <div className="text-[10px] text-muted-foreground">{entry.referred?.email || 'N/A'}</div>
                        </div>
                        <div>
                          {entry.status === 'converted' ? (
                            <span className="inline-flex bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold text-[9px]">
                              Paying
                            </span>
                          ) : entry.status === 'fraudulent' ? (
                            <span className="inline-flex bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold text-[9px]">
                              Flagged
                            </span>
                          ) : (
                            <span className="inline-flex bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-1.5 py-0.5 rounded-full font-bold text-[9px]">
                              Free
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-dashed border-zinc-100 dark:border-white/[0.04]">
                        <span className="font-semibold uppercase tracking-wider">Joined Date</span>
                        <span className="font-medium text-zinc-650 dark:text-zinc-300">{joinedDate}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No referred friends signed up yet. Share your referral link to get started!
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
