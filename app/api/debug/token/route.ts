import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // 1. Get the first connected Instagram account
    const { data: account, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .order('connected_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !account) {
      return NextResponse.json({
        success: false,
        error: 'No connected Instagram account found in database.',
        dbError
      }, { status: 404 })
    }

    let accessToken: string
    try {
      accessToken = decrypt(account.access_token_encrypted)
    } catch (decryptError: any) {
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt access token.',
        message: decryptError.message
      }, { status: 500 })
    }

    const isDirect = accessToken.startsWith('IG')

    // 2. Query me details from graph.instagram.com to verify token validity
    let meData: any = null
    try {
      const meRes = await fetch(`https://graph.instagram.com/v19.0/me?fields=user_id,username&access_token=${accessToken}`)
      meData = await meRes.json()
    } catch (e: any) {
      meData = { error: e.message }
    }

    return NextResponse.json({
      success: true,
      username: account.username,
      instagram_user_id: account.instagram_user_id,
      token_type: isDirect ? 'Direct Instagram (IG)' : 'Facebook Page (EAA)',
      instagram_me_info: meData
    })

  } catch (err: any) {
    console.error('[Diagnostic Token API] Error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
