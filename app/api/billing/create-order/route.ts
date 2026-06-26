import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, workspaceId, payWithBalance } = await request.json()
    if (!planId || !workspaceId) {
      return NextResponse.json({ error: 'Missing planId or workspaceId' }, { status: 400 })
    }

    // 2. Verify workspace ownership
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Forbidden. Workspace ownership mismatch.' }, { status: 403 })
    }

    // 3. Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.price_inr === 0) {
      return NextResponse.json({ error: 'Cannot purchase free plan' }, { status: 400 })
    }

    // 3b. Check if the user has an active referral ('joined' status)
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', user.id)
      .eq('status', 'joined')
      .maybeSingle()

    let baseAmount = plan.price_inr
    if (referral) {
      baseAmount = Math.round(baseAmount * 0.85) // 15% discount for referred user's first purchase
    }

    let finalAmount = baseAmount
    if (payWithBalance) {
      finalAmount = Math.round(finalAmount * 0.90) // 10% discount for paying with balance
    }

    // 3c. If checking out via balance
    if (payWithBalance) {
      // Calculate user's total balance from ledger
      const { data: ledger } = await supabase
        .from('referral_ledger')
        .select('*')
        .eq('profile_id', user.id)

      let withdrawable = 0
      let promo = 0
      const ledgerEntries = ledger || []
      
      for (const entry of ledgerEntries) {
        if (['referral_commission', 'withdrawal', 'friend_transfer_sent'].includes(entry.transaction_type)) {
          withdrawable += entry.amount
        } else if (['friend_transfer_received', 'subscription_purchase'].includes(entry.transaction_type)) {
          promo += entry.amount
        }
      }
      
      const totalBalance = Math.max(0, withdrawable) + Math.max(0, promo)

      if (totalBalance < finalAmount) {
        return NextResponse.json({
          error: `Insufficient balance. Required: ₹${(finalAmount / 100).toFixed(2)}, Available: ₹${(totalBalance / 100).toFixed(2)}`
        }, { status: 400 })
      }

      // Deduct from ledger (add a debit transaction - Using Admin Client to bypass RLS)
      const { error: debitError } = await supabaseAdmin
        .from('referral_ledger')
        .insert({
          profile_id: user.id,
          amount: -finalAmount,
          transaction_type: 'subscription_purchase',
          status: 'completed',
          description: `Purchased ${plan.name} Plan using balance`
        })

      if (debitError) throw debitError

      // Upsert the workspace subscription (Using Admin Client to bypass RLS)
      const periodStart = new Date()
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          workspace_id: workspaceId,
          plan_id: planId,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'workspace_id' })

      if (subError) throw subError

      // Process referral conversion for this user (credits referrer if any - Using Admin Client to bypass RLS)
      const { processReferralConversion } = await import('@/lib/referral-helper')
      await processReferralConversion({
        supabase: supabaseAdmin,
        userId: user.id,
        paidAmountPaise: finalAmount
      })

      return NextResponse.json({
        success: true,
        viaBalance: true,
        message: `Successfully purchased ${plan.name} Plan using balance.`
      })
    }

    // 4. Create Razorpay order via REST API
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys are not configured on server' }, { status: 500 })
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: finalAmount, // price is already in paise (e.g. 49900), discounted if applicable
        currency: 'INR',
        receipt: `rcpt_${workspaceId.slice(0, 8)}_${Date.now()}`,
        notes: {
          planId,
          workspaceId,
          userId: user.id,
        },
      }),
    })

    const orderData = await razorpayRes.json()
    if (!razorpayRes.ok) {
      console.error('Razorpay order creation failed:', orderData)
      return NextResponse.json({ error: orderData.error?.description || 'Failed to create Razorpay order' }, { status: 500 })
    }

    return NextResponse.json({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
    })
  } catch (err: any) {
    console.error('Create order route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
