import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const cleanUsername = username.trim().toLowerCase()
    const supabaseAdmin = createAdminClient()

    // 1. Find profile by username using Admin client to retrieve email address
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (profileErr) {
      console.error('Database error fetching profile:', profileErr)
      return NextResponse.json({ error: 'Database lookup failed' }, { status: 500 })
    }

    if (!profile || !profile.email) {
      return NextResponse.json({ error: 'No account found with this username.' }, { status: 404 })
    }

    // 2. Trigger password reset link to their connected email
    const origin = new URL(request.url).origin
    const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(
      profile.email,
      { 
        redirectTo: `${origin}/login/reset` 
      }
    )

    if (resetErr) {
      console.error('Supabase password reset error:', resetErr)
      return NextResponse.json({ error: resetErr.message || 'Failed to send password reset link.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Failed to run reset-password API route:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
