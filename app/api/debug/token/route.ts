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

    // 2. Query permissions directly from graph.instagram.com using the direct token
    const version = 'v19.0'
    const permissionsUrl = `https://graph.instagram.com/${version}/me/permissions?access_token=${accessToken}`
    console.log(`[Diagnostic Token API] Fetching permissions from: https://graph.instagram.com/${version}/me/permissions`)
    
    const permRes = await fetch(permissionsUrl)
    const permData = await permRes.json()

    return NextResponse.json({
      success: true,
      username: account.username,
      instagram_user_id: account.instagram_user_id,
      token_type: isDirect ? 'Direct Instagram (IG)' : 'Facebook Page (EAA)',
      permissions_info: permData
    })

  } catch (err: any) {
    console.error('[Diagnostic Token API] Error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
