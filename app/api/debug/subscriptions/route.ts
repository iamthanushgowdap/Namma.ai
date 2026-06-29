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
    const igUserId = account.instagram_user_id
    const username = account.username

    const results: any = {
      username,
      instagram_user_id: igUserId,
      token_type: isDirect ? 'Direct Instagram (IG)' : 'Facebook Page (EAA)',
      token_prefix: accessToken.substring(0, 10) + '...',
      appId: process.env.META_APP_ID ? 'Configured' : 'Missing',
    }

    const version = 'v19.0'
    const baseUrl = isDirect ? 'https://graph.instagram.com' : 'https://graph.facebook.com'

    // Determine target ID for subscription calls
    // Note: direct Instagram Login uses the Instagram User ID (igUserId)
    const targetId = igUserId

    // 2. Perform GET to see current subscribed apps
    const getSubUrl = `${baseUrl}/${version}/${targetId}/subscribed_apps?access_token=${accessToken}`
    console.log(`[Diagnostic API] Fetching webhook subscriptions from: ${baseUrl}/${version}/${targetId}/subscribed_apps`)
    
    const getRes = await fetch(getSubUrl)
    const getData = await getRes.json()
    results.current_subscriptions = getData

    // 3. If action=subscribe is requested, run the POST subscription
    const action = request.nextUrl.searchParams.get('action')
    if (action === 'subscribe') {
      const fields = 'comments,messages,messaging_postbacks,message_reactions'
      const postUrl = `${baseUrl}/${version}/${targetId}/subscribed_apps?subscribed_fields=${fields}&access_token=${accessToken}`
      console.log(`[Diagnostic API] Creating webhook subscriptions: POST ${baseUrl}/${version}/${targetId}/subscribed_apps`)
      
      const postRes = await fetch(postUrl, { method: 'POST' })
      const postData = await postRes.json()
      results.subscription_attempt = postData

      // Fetch subscriptions again to verify
      const verifyRes = await fetch(getSubUrl)
      const verifyData = await verifyRes.json()
      results.verified_subscriptions = verifyData
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (err: any) {
    console.error('[Diagnostic API] Error in subscriptions debug endpoint:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
