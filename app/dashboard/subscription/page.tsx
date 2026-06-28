'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Building2,
  Rocket,
  Star,
  Shield,
  RefreshCw,
  AlertTriangle,
  X,
  Lock,
  TrendingUp,
  Users,
  MessageSquare,
  Cpu,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  price_inr: number
  price_usd: number
  automations_limit: number | null
  replies_limit: number | null
  accounts_limit: number
  features: string[]
  razorpay_plan_id: string | null
}

interface Subscription {
  id: string
  workspace_id: string
  plan_id: string
  status: string
  razorpay_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

interface UsageStats {
  automations_count: number
  replies_count: number
}

// ─── Razorpay global type ─────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any
  }
}

// ─── Plan metadata helpers ────────────────────────────────────────────────────
const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Rocket,
  pro: Star,
  agency: Building2,
}

const PLAN_GRADIENT: Record<string, string> = {
  free: 'from-zinc-500 to-zinc-600',
  starter: 'from-blue-500 to-cyan-500',
  pro: 'from-[#B41DE6] to-[#0052cc]',
  agency: 'from-amber-500 to-orange-500',
}

const PLAN_GLOW: Record<string, string> = {
  free: '',
  starter: 'shadow-blue-500/10',
  pro: 'shadow-purple-500/20',
  agency: 'shadow-amber-500/10',
}

function formatPriceInr(paise: number): string {
  if (paise === 0) return 'Free'
  return `₹${(paise / 100).toLocaleString('en-IN')}/mo`
}

function formatLimit(val: number | null): string {
  return val === null ? 'Unlimited' : val.toLocaleString('en-IN')
}

// ─── Load Razorpay script ─────────────────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
function CancelModal({
  planName,
  onConfirm,
  onClose,
  loading,
}: {
  planName: string
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="font-bold text-foreground text-base">Cancel Subscription</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-2">
          Are you sure you want to cancel your <span className="text-foreground font-semibold">{planName}</span> plan?
        </p>
        <p className="text-muted-foreground/80 text-xs mb-6">
          You&apos;ll retain access until the end of your current billing period. After that, your workspace will revert to the Free plan and active automations above the free limit will be paused.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-muted hover:bg-accent text-foreground rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Keep Plan
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-650 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────
function UsageBar({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string
  used: number
  limit: number | null
  icon: React.ElementType
}) {
  const percentage = limit === null ? 0 : Math.min((used / limit) * 100, 100)
  const isWarning = limit !== null && percentage >= 80
  const isCritical = limit !== null && percentage >= 95

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
        <span className={`text-xs font-semibold ${isCritical ? 'text-red-500 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
          {used.toLocaleString('en-IN')} / {limit === null ? '∞' : limit.toLocaleString('en-IN')}
        </span>
      </div>
      {limit !== null && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
                ? 'bg-red-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-[#B41DE6] to-[#0052cc]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {limit === null && (
        <div className="w-full h-1.5 bg-gradient-to-r from-[#B41DE6]/30 to-[#0052cc]/30 rounded-full" />
      )}
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  isCurrent,
  onUpgrade,
  upgrading,
  currentPlanId,
}: {
  plan: Plan
  isCurrent: boolean
  onUpgrade: (planId: string) => void
  upgrading: string | null
  currentPlanId: string
}) {
  const Icon = PLAN_ICONS[plan.id] || CreditCard
  const isPro = plan.id === 'pro'
  const isUpgrading = upgrading === plan.id
  const isFree = plan.id === 'free'

  const PLAN_TIERS: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    agency: 3,
  }
  const currentTier = PLAN_TIERS[currentPlanId] || 0
  const targetTier = PLAN_TIERS[plan.id] || 0
  const isLowerPlan = targetTier < currentTier

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden group
        ${isPro
          ? 'border-transparent bg-card shadow-xl'
          : 'border-border/70 bg-card/50 hover:border-border/90'
        }
        ${isCurrent ? 'ring-1 ring-[#B41DE6]/40' : ''}
        shadow-lg ${PLAN_GLOW[plan.id] || ''}
      `}
    >
      {/* Pro gradient border */}
      {isPro && (
        <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-br from-[#B41DE6] via-[#0052cc] to-[#B41DE6] pointer-events-none">
          <div className="w-full h-full rounded-2xl bg-card" />
        </div>
      )}

      {/* Most Popular badge */}
      {isPro && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-[#B41DE6] to-[#0052cc] text-white text-[10px] font-bold px-4 py-1 rounded-b-full flex items-center gap-1 shadow-lg shadow-purple-600/30">
            <Sparkles className="w-2.5 h-2.5" />
            MOST POPULAR
          </div>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-1 bg-[#B41DE6]/20 border border-[#B41DE6]/40 text-[#B41DE6] dark:text-[#d97aff] text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" />
            CURRENT
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 flex flex-col flex-1">
        {/* Plan icon & name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${PLAN_GRADIENT[plan.id]} shadow-md`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-foreground text-base">{plan.name}</span>
        </div>

        {/* Price */}
        <div className="mb-5">
          <span className={`text-3xl font-extrabold tracking-tight ${isPro ? 'bg-gradient-to-r from-[#B41DE6] to-[#0052cc] bg-clip-text text-transparent' : 'text-foreground'}`}>
            {plan.price_inr === 0 ? 'Free' : `₹${(plan.price_inr / 100).toLocaleString('en-IN')}`}
          </span>
          {plan.price_inr > 0 && (
            <span className="text-muted-foreground text-sm font-normal ml-1">/month</span>
          )}
        </div>

        {/* Limits summary */}
        <div className="grid grid-cols-1 gap-1.5 mb-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="w-3 h-3 text-muted-foreground/60" />
            <span><span className="text-foreground font-medium">{formatLimit(plan.automations_limit)}</span> automations</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3 text-muted-foreground/60" />
            <span><span className="text-foreground font-medium">{formatLimit(plan.replies_limit)}</span> replies/month</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3 text-muted-foreground/60" />
            <span><span className="text-foreground font-medium">{plan.accounts_limit}</span> Instagram account{plan.accounts_limit > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Feature list */}
        <ul className="space-y-2 mb-6 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => !isCurrent && !isFree && !isLowerPlan && onUpgrade(plan.id)}
          disabled={isCurrent || isFree || isLowerPlan || isUpgrading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
            ${isCurrent
              ? 'bg-muted text-muted-foreground cursor-default'
              : isFree
              ? 'bg-muted/50 text-muted-foreground/60 cursor-default'
              : isLowerPlan
              ? 'bg-muted/20 text-muted-foreground/45 border border-border/20 cursor-not-allowed opacity-50'
              : isPro
              ? 'bg-gradient-to-r from-[#B41DE6] to-[#0052cc] text-white hover:opacity-90 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 active:scale-[0.98]'
              : 'bg-foreground hover:opacity-90 text-background active:scale-[0.98]'
            }
            disabled:cursor-default disabled:active:scale-100
          `}
        >
          {isUpgrading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : isCurrent ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Current Plan
            </>
          ) : isFree ? (
            'Your Base Plan'
          ) : isLowerPlan ? (
            'Unavailable'
          ) : (
            <>
              Upgrade to {plan.name}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Payment Method Selection Modal ───────────────────────────────────────────
function PaymentMethodModal({
  plan,
  balance,
  isReferred,
  onClose,
  onPayWithBalance,
  onPayWithRazorpay,
  loading,
}: {
  plan: Plan
  balance: number // total in paise
  isReferred: boolean
  onClose: () => void
  onPayWithBalance: () => void
  onPayWithRazorpay: () => void
  loading: boolean
}) {
  // Calculate pricing options
  let basePrice = plan.price_inr
  if (isReferred) {
    basePrice = Math.round(basePrice * 0.85) // 15% discount for referred users
  }

  const balancePrice = Math.round(basePrice * 0.90) // 10% discount for paying with balance
  const hasEnoughBalance = balance >= balancePrice

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-white/40 dark:bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/40 dark:border-zinc-800/85 rounded-2xl p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#B41DE6]/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] tracking-wider uppercase font-bold text-[#B41DE6] bg-[#B41DE6]/10 px-2.5 py-1 rounded-full">
            Upgrade Subscription
          </span>
          <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-xl mt-2.5">
            Select Payment Method
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
            Choose how you would like to pay for the <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{plan.name}</span> plan.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Option 1: Pay with Balance */}
          <div
            className={`relative rounded-xl border p-4 transition-all ${
              hasEnoughBalance
                ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/45 dark:bg-zinc-900/40 hover:border-[#B41DE6]/50 hover:bg-[#B41DE6]/3'
                : 'border-zinc-200/50 dark:border-zinc-850/40 bg-zinc-100/30 dark:bg-zinc-950/10 opacity-75'
            }`}
          >
            {hasEnoughBalance && (
              <div className="absolute top-3 right-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                Extra 10% Off!
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-gradient-to-br from-[#B41DE6] to-[#0052cc] text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Pay with Referral/Promo Balance</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Your Balance:</span>
                  <span className="text-xs font-semibold text-zinc-855 dark:text-white">₹{(balance / 100).toFixed(2)}</span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-lg font-extrabold text-zinc-900 dark:text-white">₹{(balancePrice / 100).toFixed(2)}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">for first month</span>
                  {isReferred && (
                    <span className="text-[10px] line-through text-zinc-400 dark:text-zinc-600">₹{(plan.price_inr / 100).toFixed(2)}</span>
                  )}
                </div>

                {!hasEnoughBalance && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Need ₹{((balancePrice - balance) / 100).toFixed(2)} more to pay with balance.
                  </p>
                )}

                {hasEnoughBalance && (
                  <button
                    onClick={onPayWithBalance}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-[#B41DE6] to-[#0052cc] hover:opacity-90 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-md shadow-purple-500/15 cursor-pointer"
                  >
                    {loading ? 'Processing Transaction...' : 'Pay with Balance'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Option 2: Pay with Razorpay */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55/45 dark:bg-zinc-900/40 hover:border-indigo-500/50 hover:bg-indigo-500/3 p-4 transition-all">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-white border border-zinc-200 dark:border-zinc-700">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Credit/Debit Card, UPI, Netbanking</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Secure payment via Razorpay checkout gateway.</p>

                <div className="flex items-baseline gap-2 mt-2.5">
                  <span className="text-lg font-extrabold text-zinc-900 dark:text-white">₹{(basePrice / 100).toFixed(2)}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">for first month</span>
                  {isReferred && (
                    <span className="text-[10px] line-through text-zinc-400 dark:text-zinc-600">₹{(plan.price_inr / 100).toFixed(2)}</span>
                  )}
                </div>

                {isReferred && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                    15% first-purchase discount automatically applied!
                  </p>
                )}

                <button
                  onClick={onPayWithRazorpay}
                  disabled={loading}
                  className="w-full mt-4 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 disabled:opacity-50 text-white dark:text-zinc-950 font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {loading ? 'Opening Razorpay Gateway...' : 'Pay with Razorpay'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { activeWorkspace } = useWorkspace()
  const supabase = createClient()

  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageStats>({ automations_count: 0, replies_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<Plan | null>(null)
  const [referralBalance, setReferralBalance] = useState({ withdrawable: 0, promo: 0, total: 0 })
  const [isReferred, setIsReferred] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchBillingData = useCallback(async () => {
    if (!activeWorkspace) return
    setLoading(true)
    setError(null)

    try {
      // Fetch plans
      const { data: plansData, error: plansErr } = await supabase
        .from('plans')
        .select('*')
        .order('price_inr', { ascending: true })

      if (plansErr) throw plansErr
      setPlans((plansData || []) as Plan[])

      // Fetch workspace subscription
      const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .single()

      if (subErr && subErr.code !== 'PGRST116') throw subErr
      setSubscription(subData as Subscription | null)

      // Fetch usage stats
      const { count: automationsCount } = await supabase
        .from('automations')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', activeWorkspace.id)

      // Count replies this month using messages sent by 'ai' sender
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: repliesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender', 'ai')
        .gte('created_at', startOfMonth.toISOString())
        .in(
          'conversation_id',
          (
            await supabase
              .from('conversations')
              .select('id')
              .eq('workspace_id', activeWorkspace.id)
          ).data?.map((c: { id: string }) => c.id) || []
        )

      setUsage({
        automations_count: automationsCount || 0,
        replies_count: repliesCount || 0,
      })

      // Fetch referral details
      try {
        const refRes = await fetch('/api/referral')
        if (refRes.ok) {
          const refData = await refRes.json()
          setReferralBalance(refData.balances || { withdrawable: 0, promo: 0, total: 0 })
        }
      } catch (err) {
        console.error('Failed to fetch referral details:', err)
      }

      // Check if user is referred themselves
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: selfReferral } = await supabase
            .from('referrals')
            .select('status')
            .eq('referred_id', user.id)
            .eq('status', 'joined')
            .maybeSingle()
          setIsReferred(!!selfReferral)
        }
      } catch (err) {
        console.error('Failed to verify self referral status:', err)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }, [activeWorkspace, supabase])

  useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  // ── Upgrade via Referral/Promo Balance ──────────────────────────────────────
  const handleUpgradeWithBalance = async (planId: string) => {
    if (!activeWorkspace) return
    setUpgrading(planId)

    try {
      const res = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          workspaceId: activeWorkspace.id,
          payWithBalance: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete balance checkout')

      showToast('success', `Successfully upgraded to ${plans.find((p) => p.id === planId)?.name} plan using referral balance!`)
      await fetchBillingData()
    } catch (err: any) {
      showToast('error', err.message || 'Payment failed. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  // ── Upgrade via Razorpay ────────────────────────────────────────────────────
  const handleUpgradeWithRazorpay = async (planId: string) => {
    if (!activeWorkspace) return
    setUpgrading(planId)

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load payment gateway. Please try again.')

      // Create order on our server
      const orderRes = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, workspaceId: activeWorkspace.id }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create payment order')

      const { orderId, amount, currency, keyId } = orderData

      // Get user info for prefill
      const { data: { user } } = await supabase.auth.getUser()

      // Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: 'AutoEngage',
          description: `Upgrade to ${plans.find((p) => p.id === planId)?.name} Plan`,
          image: '/AutoEngageai_logo.png',
          prefill: {
            email: user?.email || '',
          },
          theme: {
            color: '#B41DE6',
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled'))
            },
          },
          handler: async (response: {
            razorpay_payment_id: string
            razorpay_order_id: string
            razorpay_signature: string
          }) => {
            try {
              // Verify payment on server
              const verifyRes = await fetch('/api/billing/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  planId,
                  workspaceId: activeWorkspace.id,
                }),
              })

              const verifyData = await verifyRes.json()
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed')

              resolve()
            } catch (err) {
              reject(err)
            }
          },
        })

        rzp.open()
      })

      showToast('success', `Successfully upgraded to ${plans.find((p) => p.id === planId)?.name} plan!`)
      await fetchBillingData()
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        showToast('error', err.message || 'Payment failed. Please try again.')
      }
    } finally {
      setUpgrading(null)
    }
  }

  // ── Cancel subscription ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!subscription?.razorpay_subscription_id && subscription?.plan_id !== 'free') {
      // If no Razorpay sub ID but on paid plan, just revert to free in DB
    }
    setCancelLoading(true)
    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription')
      showToast('success', 'Subscription cancelled. You will retain access until the end of the billing period.')
      setShowCancelModal(false)
      await fetchBillingData()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to cancel subscription')
    } finally {
      setCancelLoading(false)
    }
  }

  const currentPlan = plans.find((p) => p.id === (subscription?.plan_id || 'free'))
  const isPaidPlan = subscription?.plan_id !== 'free' && subscription?.plan_id != null

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#B41DE6] to-[#0052cc] flex items-center justify-center animate-pulse">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs text-muted-foreground animate-pulse">Loading billing data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Toast Notification ────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-sm transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Cancel Modal ──────────────────────────────────────────── */}
      {showCancelModal && (
        <CancelModal
          planName={currentPlan?.name || 'current'}
          onConfirm={handleCancel}
          onClose={() => setShowCancelModal(false)}
          loading={cancelLoading}
        />
      )}

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Subscription & Plans
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription and usage for <span className="text-foreground font-medium">{activeWorkspace?.name}</span>.
        </p>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Current Plan Summary ──────────────────────────────────── */}
      {currentPlan && (
        <div className="relative rounded-2xl overflow-hidden border border-border/70 bg-card/60 backdrop-blur-sm p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#B41DE6]/5 via-transparent to-[#0052cc]/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* Left: Plan info */}
            <div className="flex items-center gap-4 flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${PLAN_GRADIENT[currentPlan.id]} shadow-lg`}>
                {(() => {
                  const Icon = PLAN_ICONS[currentPlan.id] || CreditCard
                  return <Icon className="w-6 h-6 text-white" />
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground text-lg">{currentPlan.name} Plan</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    subscription?.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
                      : subscription?.status === 'cancelled'
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    {subscription?.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {currentPlan.price_inr === 0
                    ? 'No charge — forever free'
                    : `${formatPriceInr(currentPlan.price_inr)} · billed monthly`}
                </p>
                {subscription?.current_period_end && (
                  <p className="text-muted-foreground/80 text-xs mt-0.5">
                    {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} on{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Cancellation indicator (if scheduled) */}
            {subscription?.cancel_at_period_end && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5" />
                Cancellation scheduled
              </div>
            )}
          </div>

          {/* Usage stats */}
          <div className="relative mt-6 pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <UsageBar
              label="Automations"
              used={usage.automations_count}
              limit={currentPlan.automations_limit}
              icon={Cpu}
            />
            <UsageBar
              label="Replies this month"
              used={usage.replies_count}
              limit={currentPlan.replies_limit}
              icon={MessageSquare}
            />
          </div>
        </div>
      )}

      {/* ── Plans Grid ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-[#B41DE6]" />
          <h2 className="font-bold text-foreground text-sm">Choose your plan</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={subscription?.plan_id === plan.id || (!subscription && plan.id === 'free')}
              currentPlanId={subscription?.plan_id || 'free'}
              onUpgrade={(planId) => {
                const targetPlan = plans.find((p) => p.id === planId)
                if (targetPlan) setSelectedPlanForUpgrade(targetPlan)
              }}
              upgrading={upgrading}
            />
          ))}
        </div>
      </div>

      {/* ── Razorpay Security Banner ──────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-muted/40 border border-border/50">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-muted-foreground text-xs">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            Payments powered by{' '}
            <strong className="text-foreground font-semibold">Razorpay</strong>
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            256-bit SSL Encryption
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span>100% Secure Checkout</span>
        </div>
      </div>

      {selectedPlanForUpgrade && (
        <PaymentMethodModal
          plan={selectedPlanForUpgrade}
          balance={referralBalance.total}
          isReferred={isReferred}
          onClose={() => setSelectedPlanForUpgrade(null)}
          onPayWithBalance={async () => {
            const planId = selectedPlanForUpgrade.id
            setSelectedPlanForUpgrade(null)
            await handleUpgradeWithBalance(planId)
          }}
          onPayWithRazorpay={async () => {
            const planId = selectedPlanForUpgrade.id
            setSelectedPlanForUpgrade(null)
            await handleUpgradeWithRazorpay(planId)
          }}
          loading={upgrading !== null}
        />
      )}
    </div>
  )
}
