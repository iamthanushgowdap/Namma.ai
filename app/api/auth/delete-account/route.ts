import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Initialize admin client and delete user from auth
    const adminSupabase = createAdminClient()
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return NextResponse.json({ error: deleteError.message || 'Failed to delete user account' }, { status: 500 })
    }

    // 3. Log user out by clearing session/cookies
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete account route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
