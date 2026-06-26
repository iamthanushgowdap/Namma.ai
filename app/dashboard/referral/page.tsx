'use client'

import { useEffect, useState } from 'react'
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  AlertCircle, 
  ArrowRightLeft, 
  Wallet, 
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

interface LedgerEntry {
  id: string
  amount: number
  transaction_type: string
  status: string
  description: string
  created_at: string
}

interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  status: string
  created_at: string
  referred?: {
    name: string
    email: string
    created_at: string
  } | null
}

export default function ReferralDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // Link copy state
  const [copied, setCopied] = useState(false)

  // Forms state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferEmail, setTransferEmail] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)

  const [showKycForm, setShowKycForm] = useState(false)
  const [panCard, setPanCard] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [kycLoading, setKycLoading] = useState(false)

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/referral')
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setData(result)
      
      // Pre-fill KYC values if available
      if (result.kycData) {
        setPanCard(result.kycData.panCard || '')
        setBankName(result.kycData.bankName || '')
        setAccountNumber(result.kycData.accountNumber || '')
        setIfscCode(result.kycData.ifscCode || '')
      }
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

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    const amountVal = parseFloat(withdrawAmount)
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const amountInPaise = Math.round(amountVal * 100)
    setWithdrawLoading(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount: amountInPaise })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setSuccessMsg(result.message || 'Withdrawal request submitted successfully.')
      setWithdrawAmount('')
      setShowWithdrawModal(false)
      fetchReferralData()
    } catch (err: any) {
      setError(err.message || 'Failed to request withdrawal')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    const amountVal = parseFloat(transferAmount)
    if (isNaN(amountVal) || amountVal <= 0 || !transferEmail) {
      setError('Please fill in recipient email and a valid amount')
      return
    }

    const amountInPaise = Math.round(amountVal * 100)
    setTransferLoading(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transfer', email: transferEmail, amount: amountInPaise })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setSuccessMsg(result.message || 'Balance transferred successfully!')
      setTransferEmail('')
      setTransferAmount('')
      setShowTransferModal(false)
      fetchReferralData()
    } catch (err: any) {
      setError(err.message || 'Transfer failed')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    if (!panCard || !bankName || !accountNumber || !ifscCode) {
      setError('Please fill in all KYC details')
      return
    }

    setKycLoading(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'kyc_submit',
          panCard: panCard.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim()
        })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      setSuccessMsg('KYC documents submitted and verified successfully.')
      setShowKycForm(false)
      fetchReferralData()
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC details')
    } finally {
      setKycLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Loading referral center...</span>
      </div>
    )
  }

  const withdrawableInr = (data?.balances?.withdrawable || 0) / 100
  const promoInr = (data?.balances?.promo || 0) / 100
  const totalInr = (data?.balances?.total || 0) / 100
  const hasMinReferrals = (data?.stats?.converted || 0) >= 2

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Title & Stats */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Refer & Earn
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite your friends, share the benefits, and unlock withdrawal payouts or subscription discounts.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-800 dark:text-red-400 text-xs rounded-xl animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/35 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl animate-in fade-in duration-200">
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
            <div className="flex-1 px-4 py-2.5 bg-zinc-100/60 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-xs text-zinc-650 dark:text-zinc-350 truncate">
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
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Paying Users</span>
              <p className="text-xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{data?.stats?.converted || 0}</p>
            </div>
          </div>
          {data?.stats?.converted < 2 ? (
            <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-450 leading-snug">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You need at least 2 active paying referrals (you currently have {data?.stats?.converted || 0}) to start cash withdrawals.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-450 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Withdrawal requirement unlocked!</span>
            </div>
          )}
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Ledger Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Total Balance</span>
            <Wallet className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3">
            ₹{totalInr.toFixed(2)}
          </p>
          <span className="text-[10px] text-zinc-450 mt-1 block">
            Withdrawable Cash + Promo Subscription credits.
          </span>
        </div>

        {/* Withdrawable Cash Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Withdrawable Cash</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-650 dark:text-emerald-450 mt-3">
              ₹{withdrawableInr.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-emerald-600/15 mt-4 transition-colors"
          >
            Withdraw to Bank
          </button>
        </div>

        {/* Promo / Subscription Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Promo Balance</span>
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400 mt-3">
              ₹{promoInr.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/15 mt-4 transition-colors"
          >
            Transfer to Friend
          </button>
        </div>
      </div>

      {/* KYC Warning Box */}
      {data?.kycStatus !== 'verified' && (
        <div className="glass-panel rounded-3xl p-6 border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-550 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">KYC Verification Missing</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                KYC is optional for small balances, but is **mandatory** for withdrawals exceeding ₹10,000. 
                Complete your details now to keep your account verified.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowKycForm(!showKycForm)}
            className="py-2 px-4 bg-amber-550 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {showKycForm ? 'Close KYC' : 'Verify KYC'}
          </button>
        </div>
      )}

      {/* KYC Upload Form */}
      {showKycForm && (
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-xl">
          <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-500" />
            Legal KYC Verification
          </h3>
          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">PAN Card Number</label>
                <input
                  type="text"
                  required
                  value={panCard}
                  onChange={e => setPanCard(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-3.5 py-2 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="SBI, HDFC, ICICI, etc."
                  className="w-full px-3.5 py-2 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Bank Account Number</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456789012"
                  className="w-full px-3.5 py-2 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  className="w-full px-3.5 py-2 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4 pt-2">
              <button
                type="submit"
                disabled={kycLoading}
                className={`py-2 px-5 rounded-xl text-xs font-semibold transition-all ${
                  kycLoading
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white cursor-pointer shadow-md shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {kycLoading ? 'Verifying...' : 'Submit & Verify KYC'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ledger History List */}
      <div className="glass-panel rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 p-6 overflow-hidden">
        <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-4 flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
          Transaction Audits & Ledger
        </h3>
        <div className="overflow-x-auto">
          {data?.ledger?.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="py-3 font-semibold">Date</th>
                  <th className="py-3 font-semibold">Transaction Description</th>
                  <th className="py-3 font-semibold">Type</th>
                  <th className="py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((entry: LedgerEntry) => {
                  const isDebit = entry.amount < 0
                  const cleanAmount = Math.abs(entry.amount) / 100
                  return (
                    <tr key={entry.id} className="border-b border-border/20 last:border-0 text-zinc-650 dark:text-zinc-350">
                      <td className="py-3.5 whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                      <td className="py-3.5 max-w-sm leading-relaxed">{entry.description || 'N/A'}</td>
                      <td className="py-3.5 capitalize font-medium">{entry.transaction_type.replace(/_/g, ' ')}</td>
                      <td className={`py-3.5 font-bold text-right ${isDebit ? 'text-red-500' : 'text-emerald-500'}`}>
                        {isDebit ? '-' : '+'}₹{cleanAmount.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No transactions recorded in ledger history yet.
            </div>
          )}
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-zinc-800/85 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Withdraw to Bank Account
              </h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-2 leading-relaxed">
                Minimum withdrawal amount is **₹500**. You must have at least 2 paying referrals to start.
              </p>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Withdrawal Amount (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-450 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="500.00"
                    min="500"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 glass-input rounded-xl text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-border/40 p-3.5 rounded-xl text-[10px] space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Withdrawable Balance:</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-100">₹{withdrawableInr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paying Referrals:</span>
                  <span className={`font-bold ${hasMinReferrals ? 'text-emerald-600' : 'text-red-500'}`}>
                    {data?.stats?.converted || 0} / 2
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-1.5 font-medium text-zinc-650 dark:text-zinc-350">
                  <span>Processing Fee:</span>
                  <span>{withdrawableInr + (parseFloat(withdrawAmount) || 0) > 10000 ? '6% (TDS Included)' : '3%'}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading || !hasMinReferrals || withdrawableInr < 500}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all ${
                    (withdrawLoading || !hasMinReferrals || withdrawableInr < 500)
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-500/15 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {withdrawLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-zinc-800/85 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 mb-4">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Transfer to Namma.ai Friend
              </h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-2 leading-relaxed">
                Transfer your cash balance to a friend&apos;s account. This carries **0% fee**. 
                Transferred funds will be credited to their Promo Balance.
              </p>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={transferEmail}
                  onChange={e => setTransferEmail(e.target.value)}
                  placeholder="friend@company.com"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Transfer Amount (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-450 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder="100.00"
                    min="1"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 glass-input rounded-xl text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-between bg-zinc-50 dark:bg-zinc-950/20 border border-border/40 p-3 rounded-xl text-[10px] text-muted-foreground">
                <span>Withdrawable Balance:</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-100">₹{withdrawableInr.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading || withdrawableInr <= 0}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all ${
                    (transferLoading || withdrawableInr <= 0)
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white cursor-pointer shadow-lg shadow-indigo-550/15 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {transferLoading ? 'Transferring...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
