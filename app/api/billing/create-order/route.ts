import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, workspaceId } = await request.json()
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
        amount: plan.price_inr, // price is already in paise (e.g. 49900)
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
