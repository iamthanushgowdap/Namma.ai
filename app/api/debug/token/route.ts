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

    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json({
        success: false,
        error: 'META_APP_ID or META_APP_SECRET is not configured.'
      }, { status: 500 })
    }

    // 2. Query debug_token endpoint
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
    )
    const debugData = await debugRes.json()

    return NextResponse.json({
      success: true,
      username: account.username,
      instagram_user_id: account.instagram_user_id,
      debug_info: debugData
    })

  } catch (err: any) {
    console.error('[Diagnostic Token API] Error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
