'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  DollarSign,
  ArrowRightLeft,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Check,
  X
} from 'lucide-react'

interface LedgerEntry {
  id: string
  amount: number
  transaction_type: string
  status: string
  description: string
  created_at: string
}

export default function WalletPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modals state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferEmail, setTransferEmail] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)

  // KYC state
  const [showKycForm, setShowKycForm] = useState(false)
  const [panCard, setPanCard] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [kycLoading, setKycLoading] = useState(false)

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/referral')
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setData(result)

      if (result.kycData) {
        setPanCard(result.kycData.panCard || '')
        setBankName(result.kycData.bankName || '')
        setAccountNumber(result.kycData.accountNumber || '')
        setIfscCode(result.kycData.ifscCode || '')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

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
      fetchWalletData()
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
      fetchWalletData()
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
      fetchWalletData()
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
        <span className="text-xs text-zinc-400">Loading wallet center...</span>
      </div>
    )
  }

  const withdrawableInr = (data?.balances?.withdrawable || 0) / 100
  const promoInr = (data?.balances?.promo || 0) / 100
  const totalInr = (data?.balances?.total || 0) / 100
  const hasMinReferrals = (data?.stats?.converted || 0) >= 2

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Title & Description */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          My Wallet
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your cash commissions, transfer promo credits, complete KYC, and view transaction statements.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-800 dark:text-red-400 text-xs rounded-xl animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-200 dark:border-emerald-900/35 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Ledger Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold uppercase">Total Balance</span>
              <Wallet className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3">
              ₹{totalInr.toFixed(2)}
            </p>
          </div>
          <span className="text-[10px] text-zinc-450 mt-4 block">
            Withdrawable Cash + Promo Subscription credits.
          </span>
        </div>

        {/* Withdrawable Cash Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold uppercase">Withdrawable Cash</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-650 dark:text-emerald-450 mt-3">
              ₹{withdrawableInr.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-emerald-600/15 mt-4 transition-colors"
          >
            Withdraw to Bank
          </button>
        </div>

        {/* Promo / Subscription Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold uppercase">Promo Balance</span>
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400 mt-3">
              ₹{promoInr.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/15 mt-4 transition-colors"
          >
            Transfer to Friend
          </button>
        </div>
      </div>

      {/* KYC Warning Box */}
      {data?.kycStatus !== 'verified' && (
        <div className="glass-panel rounded-3xl p-6 border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">KYC Verification Missing</h4>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5 leading-relaxed">
                KYC is optional for small balances, but is **mandatory** for withdrawals exceeding ₹10,050. 
                Complete your details now to keep your account verified.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowKycForm(!showKycForm)}
            className="py-2 px-4 bg-amber-600 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
          Transaction Audits &amp; Ledger
        </h3>
        <div>
          {data?.ledger?.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="py-3 font-semibold">Date</th>
                      <th className="py-3 font-semibold">Type</th>
                      <th className="py-3 font-semibold">Description</th>
                      <th className="py-3 font-semibold">Status</th>
                      <th className="py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ledger.map((entry: LedgerEntry) => {
                      const amountVal = entry.amount / 100
                      const isCredit = entry.amount > 0
                      return (
                        <tr key={entry.id} className="border-b border-border/20 last:border-0 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="py-3.5">{new Date(entry.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5 capitalize font-medium">{entry.transaction_type.replace(/_/g, ' ')}</td>
                          <td className="py-3.5">{entry.description}</td>
                          <td className="py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              entry.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
                                : entry.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/25 animate-pulse'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className={`py-3.5 text-right font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                            {isCredit ? '+' : ''}₹{amountVal.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden space-y-4">
                {data.ledger.map((entry: LedgerEntry) => {
                  const amountVal = entry.amount / 100
                  const isCredit = entry.amount > 0
                  return (
                    <div key={entry.id} className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs capitalize">
                            {entry.transaction_type.replace(/_/g, ' ')}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={`font-bold text-sm ${isCredit ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                          {isCredit ? '+' : ''}₹{amountVal.toFixed(2)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
                        {entry.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-dashed border-zinc-100 dark:border-white/[0.04]">
                        <span className="text-muted-foreground uppercase font-semibold tracking-wider">Status</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full font-bold text-[8px] border ${
                          entry.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
                            : entry.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/25'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No transactions recorded in your ledger statement yet.
            </div>
          )}
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-2">
              Withdraw to Bank Account
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal mb-4">
              Payouts are transferred via IMPS/NEFT directly. 
              {data?.kycStatus !== 'verified' && (
                <span className="text-rose-600 dark:text-rose-400 font-semibold block mt-1">
                  ⚠️ Note: KYC verification is required for payouts exceeding ₹10,050.
                </span>
              )}
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Withdrawal Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={withdrawableInr}
                    required
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-7 pr-4 py-2.5 glass-input rounded-xl text-xs font-semibold transition-colors"
                  />
                </div>
                <span className="text-[10px] text-zinc-450 block mt-1">
                  Available withdrawable cash: ₹{withdrawableInr.toFixed(2)}
                </span>
              </div>
              <button
                type="submit"
                disabled={withdrawLoading || withdrawableInr <= 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
              >
                {withdrawLoading ? 'Processing Payout...' : 'Request Payout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTransferModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-2">
              Transfer Promo Credits to Friend
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal mb-4">
              Instantly transfer promotional wallet balance to another registered AutoEngage user via their email.
            </p>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Friend's Account Email</label>
                <input
                  type="email"
                  required
                  value={transferEmail}
                  onChange={e => setTransferEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500">Transfer Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={promoInr}
                    required
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-7 pr-4 py-2.5 glass-input rounded-xl text-xs font-semibold transition-colors"
                  />
                </div>
                <span className="text-[10px] text-zinc-450 block mt-1">
                  Available promo credits: ₹{promoInr.toFixed(2)}
                </span>
              </div>
              <button
                type="submit"
                disabled={transferLoading || promoInr <= 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 active:scale-[0.98] cursor-pointer"
              >
                {transferLoading ? 'Transferring Credits...' : 'Send Credits'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
