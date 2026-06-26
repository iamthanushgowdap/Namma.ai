import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to query database to bypass RLS for joins (e.g. referred user profiles)
    const supabaseAdmin = createAdminClient()

    // 2. Fetch profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 404 })
    }

    // 3. Fetch all ledger entries
    const { data: ledger, error: ledgerError } = await supabaseAdmin
      .from('referral_ledger')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    if (ledgerError) {
      console.error('Ledger fetch error:', ledgerError)
    }

    // 4. Fetch referrals list (bypassing RLS on profiles to get referred user's name/email)
    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from('referrals')
      .select('*, referred:referred_id(name, email, created_at)')
      .eq('referrer_id', user.id)

    if (referralsError) {
      console.error('Referrals fetch error:', referralsError)
    }

    // Calculate balances
    let withdrawable = 0
    let promo = 0
    const ledgerEntries = ledger || []
    
    for (const entry of ledgerEntries) {
      if (['referral_commission', 'withdrawal', 'friend_transfer_sent'].includes(entry.transaction_type)) {
        withdrawable += entry.amount // debit is negative, credit is positive
      } else if (['friend_transfer_received', 'subscription_purchase'].includes(entry.transaction_type)) {
        promo += entry.amount
      }
    }

    // Calculate statistics
    const referralList = referrals || []
    const signups = referralList.filter(r => r.status === 'joined').length
    const converted = referralList.filter(r => r.status === 'converted').length
    const fraudulent = referralList.filter(r => r.status === 'fraudulent').length

    return NextResponse.json({
      referralCode: profile.referral_code,
      kycStatus: profile.kyc_status,
      kycData: profile.kyc_data || {},
      balances: {
        withdrawable: Math.max(0, withdrawable),
        promo: Math.max(0, promo),
        total: Math.max(0, withdrawable) + Math.max(0, promo)
      },
      stats: {
        signups,
        converted,
        fraudulent
      },
      ledger: ledgerEntries,
      referrals: referralList
    })
  } catch (err: any) {
    console.error('Referral GET API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[DEBUG POST /api/referral] Auth User ID:', user?.id, 'Auth Error:', authError)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { action } = body
    console.log('[DEBUG POST /api/referral] Action:', action, 'Body:', body)

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 })
    }

    // Use admin client for DB mutations and cross-profile selects to bypass RLS constraints safely
    const supabaseAdmin = createAdminClient()

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('[DEBUG POST /api/referral] Profile fetched:', profile, 'Profile Error:', profileError)

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch user's ledger entries for balance calculations
    const { data: ledger, error: ledgerError } = await supabaseAdmin
      .from('referral_ledger')
      .select('*')
      .eq('profile_id', user.id)

    console.log('[DEBUG POST /api/referral] Ledger entries count:', ledger?.length, 'Ledger Error:', ledgerError)

    let withdrawable = 0
    const ledgerEntries = ledger || []
    let cumulativeWithdrawals = 0

    for (const entry of ledgerEntries) {
      if (['referral_commission', 'withdrawal', 'friend_transfer_sent'].includes(entry.transaction_type)) {
        withdrawable += entry.amount
      }
      if (entry.transaction_type === 'withdrawal') {
        cumulativeWithdrawals += Math.abs(entry.amount) // sum of absolute withdrawal debits
      }
    }
    withdrawable = Math.max(0, withdrawable)

    // ──────── Action 1: KYC Submit ────────
    if (action === 'kyc_submit') {
      const { panCard, bankName, accountNumber, ifscCode } = body
      if (!panCard || !bankName || !accountNumber || !ifscCode) {
        return NextResponse.json({ error: 'Missing KYC verification details' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          kyc_status: 'verified', // Auto-verify in the sandbox database immediately
          kyc_data: { panCard, bankName, accountNumber, ifscCode }
        })
        .eq('id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'KYC verified successfully' })
    }

    // ──────── Action 2: Withdrawal request ────────
    if (action === 'withdraw') {
      const { amount } = body // in paise (e.g. ₹500 = 50000)
      if (!amount || amount < 50000) {
        return NextResponse.json({ error: 'Minimum withdrawal amount is ₹500' }, { status: 400 })
      }

      if (amount > withdrawable) {
        return NextResponse.json({ error: 'Insufficient withdrawable balance' }, { status: 400 })
      }

      // Check minimum paying referrals constraint (Must be at least 2 converted referrals)
      const { count, error: countErr } = await supabaseAdmin
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .eq('status', 'converted')

      if (countErr) throw countErr
      if (!count || count < 2) {
        return NextResponse.json({
          error: 'You must successfully refer at least 2 active paying users to unlock cash withdrawals.'
        }, { status: 400 })
      }

      // Check KYC requirement (cumulative exceeding ₹10,000)
      const newCumulativeTotal = cumulativeWithdrawals + amount
      const isAboveTenThousand = newCumulativeTotal > 1000000 // ₹10,000 in paise
      
      if (isAboveTenThousand && profile.kyc_status !== 'verified') {
        return NextResponse.json({
          error: 'KYC verification is required for cumulative withdrawals exceeding ₹10,000. Please complete your KYC details.'
        }, { status: 400 })
      }

      // Compute dynamic fees (3% below ₹10k, 6% above ₹10k)
      const feePercent = isAboveTenThousand ? 0.06 : 0.03
      const feeAmount = Math.round(amount * feePercent)
      const finalDeducted = amount // The user requests to withdraw this amount

      // Add debit to ledger
      const { error: ledgerErr } = await supabaseAdmin
        .from('referral_ledger')
        .insert({
          profile_id: user.id,
          amount: -finalDeducted, // Debit
          transaction_type: 'withdrawal',
          status: 'completed',
          description: `Withdrawn ₹${(finalDeducted / 100).toFixed(2)} (Processing & Compliance Fee: ₹${(feeAmount / 100).toFixed(2)})`
        })

      if (ledgerErr) throw ledgerErr
      return NextResponse.json({ success: true, message: 'Withdrawal processed successfully' })
    }

    // ──────── Action 3: Friend Transfer ────────
    if (action === 'transfer') {
      const { email, amount } = body // amount in paise
      if (!email || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Missing email or transfer amount' }, { status: 400 })
      }

      if (amount > withdrawable) {
        return NextResponse.json({ error: 'Insufficient balance to transfer' }, { status: 400 })
      }

      // Lookup target profile by email (using supabaseAdmin to bypass RLS)
      const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (targetError || !targetProfile) {
        return NextResponse.json({ error: 'Recipient account email not found on Namma.ai' }, { status: 404 })
      }

      if (targetProfile.id === user.id) {
        return NextResponse.json({ error: 'You cannot transfer referral balance to yourself.' }, { status: 400 })
      }

      // 1. Insert debit for sender
      const { error: senderErr } = await supabaseAdmin
        .from('referral_ledger')
        .insert({
          profile_id: user.id,
          amount: -amount, // Debit withdrawable balance
          transaction_type: 'friend_transfer_sent',
          status: 'completed',
          description: `Transferred ₹${(amount / 100).toFixed(2)} to ${targetProfile.name}`
        })

      if (senderErr) throw senderErr

      // 2. Insert credit for receiver (Promo Balance, non-withdrawable)
      const { error: receiverErr } = await supabaseAdmin
        .from('referral_ledger')
        .insert({
          profile_id: targetProfile.id,
          amount: amount, // Credit promo balance
          transaction_type: 'friend_transfer_received',
          status: 'completed',
          description: `Received ₹${(amount / 100).toFixed(2)} from ${profile.name}`
        })

      if (receiverErr) throw receiverErr

      return NextResponse.json({ success: true, message: 'Balance transferred successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Referral POST API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
