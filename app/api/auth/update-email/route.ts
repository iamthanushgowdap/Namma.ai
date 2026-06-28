import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User session not found' }, { status: 401 })
    }

    const { newEmail, password } = await request.json()

    if (!newEmail || !password) {
      return NextResponse.json({ error: 'New email and current password are required' }, { status: 400 })
    }

    const cleanEmail = newEmail.trim().toLowerCase()

    // 1. Verify current password by signing in with password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // 2. Update email instantly in Auth using Admin Client (bypassing confirmation links)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        email: cleanEmail,
        email_confirm: true 
      }
    )

    if (authUpdateError) {
      console.error('Admin Auth email update error:', authUpdateError)
      return NextResponse.json({ error: authUpdateError.message || 'Failed to update authentication email' }, { status: 500 })
    }

    // 3. Update email column inside profiles table
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ email: cleanEmail })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('Profiles table email update error:', profileUpdateError)
      // Non-fatal, auth email is updated. But let's log it.
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Failed to update email API route:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
