import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planId,
      workspaceId,
    } = await request.json()

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !planId ||
      !workspaceId
    ) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
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

    // 3. Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay secret key not configured' }, { status: 500 })
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // 4. Update the subscription in DB (Using Admin Client to bypass RLS)
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1) // default to 1 month subscription

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

    if (subError) {
      console.error('Subscription update failed:', subError)
      return NextResponse.json({ error: 'Failed to update subscription in database' }, { status: 500 })
    }

    // 5. Process referral conversion if user is referred (Using Admin Client to bypass RLS)
    try {
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('price_inr')
        .eq('id', planId)
        .single()

      const { data: referral } = await supabaseAdmin
        .from('referrals')
        .select('status')
        .eq('referred_id', user.id)
        .eq('status', 'joined')
        .maybeSingle()

      let fallbackAmount = plan ? plan.price_inr : 0
      if (referral && plan) {
        fallbackAmount = Math.round(fallbackAmount * 0.85) // 15% discount
      }

      const { processReferralConversion } = await import('@/lib/referral-helper')
      await processReferralConversion({
        supabase: supabaseAdmin,
        userId: user.id,
        paidAmountPaise: fallbackAmount,
        razorpayPaymentId: razorpay_payment_id
      })
    } catch (err) {
      console.error('Error processing referral conversion in verify-payment:', err)
      // Do not block subscription activation if referral processing fails
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Verify payment route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
