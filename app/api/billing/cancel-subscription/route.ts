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

    const { workspaceId } = await request.json()
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
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

    // 3. Update the subscription in DB
    // Set plan_id to 'free' and status to 'active', clear any payment details, or mark cancel_at_period_end
    // Let's set cancel_at_period_end: true if it is a recurring subscription, or if they cancel we can immediately downgrade to 'free' plan.
    // For a cleaner developer experience, let's immediately downgrade to 'free' and clear subscription IDs, or mark cancel_at_period_end = true.
    // Let's check what the user wants. The prompt says: "revert status to cancelled/free".
    // Let's set plan_id to 'free' and clear the subscription ids, or set status = 'cancelled'.
    // Let's update the subscription record:
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: 'free',
        status: 'active',
        razorpay_subscription_id: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)

    if (subError) {
      console.error('Subscription cancellation failed:', subError)
      return NextResponse.json({ error: 'Failed to cancel subscription in database' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Cancel subscription route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
