import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 })
    }

    const trimmed = username.trim().toLowerCase()

    // Instagram username validation: alphanumeric, periods, underscores, 3-30 chars
    const usernameRegex = /^[a-zA-Z0-9_.]+$/
    if (trimmed.length < 3 || trimmed.length > 30) {
      return NextResponse.json({ 
        available: false, 
        error: 'Username must be between 3 and 30 characters' 
      })
    }

    if (!usernameRegex.test(trimmed)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Username can only contain letters, numbers, underscores, and periods' 
      })
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle()

    if (error) {
      console.error('Error checking username availability:', error)
      return NextResponse.json({ available: false, error: 'Database error checking username' }, { status: 500 })
    }

    // If data is null, the username is not taken, so it is available
    const available = !data

    return NextResponse.json({ available })
  } catch (err: any) {
    console.error('Failed to run check-username API route:', err)
    return NextResponse.json({ available: false, error: 'Internal server error' }, { status: 500 })
  }
}
