import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 })
    }

    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Webhook verification skipped (Danger).')
    } else {
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (expectedSignature !== signature) {
        console.error('Razorpay Webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
      }
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event

    console.log(`Received Razorpay Webhook Event: ${event}`)

    const supabaseAdmin = createAdminClient()

    // Handle different events
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity
      const notes = paymentEntity?.notes || {}
      const orderId = paymentEntity?.order_id
      const workspaceId = notes.workspaceId
      const planId = notes.planId

      if (workspaceId && planId) {
        console.log(`Processing payment.captured for workspace: ${workspaceId}, plan: ${planId}`)

        const periodStart = new Date()
        const periodEnd = new Date()
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            workspace_id: workspaceId,
            plan_id: planId,
            status: 'active',
            razorpay_customer_id: paymentEntity.customer_id || null,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'workspace_id' })

        if (error) {
          console.error('Failed to update subscription in webhook:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        // Process referral conversion if user is referred
        const userId = notes.userId
        if (userId) {
          try {
            const { data: plan } = await supabaseAdmin
              .from('plans')
              .select('price_inr')
              .eq('id', planId)
              .single()

            const { data: referral } = await supabaseAdmin
              .from('referrals')
              .select('status')
              .eq('referred_id', userId)
              .eq('status', 'joined')
              .maybeSingle()

            let fallbackAmount = plan ? plan.price_inr : 0
            if (referral && plan) {
              fallbackAmount = Math.round(fallbackAmount * 0.85) // 15% discount
            }

            const { processReferralConversion } = await import('@/lib/referral-helper')
            await processReferralConversion({
              supabase: supabaseAdmin,
              userId: userId,
              paidAmountPaise: fallbackAmount,
              razorpayPaymentId: paymentEntity.id
            })
          } catch (err) {
            console.error('Error processing referral conversion in webhook:', err)
          }
        }
      }
    } else if (event === 'subscription.cancelled') {
      const subEntity = payload.payload?.subscription?.entity
      const subId = subEntity?.id
      const notes = subEntity?.notes || {}
      const workspaceId = notes.workspaceId

      if (workspaceId) {
        console.log(`Processing subscription.cancelled for workspace: ${workspaceId}`)
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_id: 'free',
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('workspace_id', workspaceId)

        if (error) {
          console.error('Failed to cancel subscription in webhook:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity
      const notes = paymentEntity?.notes || {}
      const workspaceId = notes.workspaceId

      if (workspaceId) {
        console.log(`Processing payment.failed for workspace: ${workspaceId}`)
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('workspace_id', workspaceId)

        if (error) {
          console.error('Failed to update subscription status on payment failure:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Razorpay webhook handler error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
