import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Get the first connected instagram account
    const { data: account, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .order('connected_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !account) {
      return NextResponse.json({ error: 'No connected Instagram account found in database', dbError }, { status: 404 })
    }

    let pageAccessToken: string
    try {
      pageAccessToken = decrypt(account.access_token_encrypted)
    } catch (decryptError: any) {
      return NextResponse.json({ 
        error: 'Failed to decrypt access token. Check if ENCRYPTION_KEY on Vercel matches the one used during connection.',
        message: decryptError.message 
      }, { status: 500 })
    }

    // 1. Fetch info about the token/page
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${pageAccessToken}`)
    const meData: any = await meRes.json()

    if (meData.error) {
      return NextResponse.json({ error: 'Failed to fetch Page details from Meta Graph API', metaError: meData.error }, { status: 500 })
    }

    const pageId = meData.id
    const pageName = meData.name

    // 2. Run manual subscription POST request
    const subscribeRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=feed,mention&access_token=${pageAccessToken}`,
      { method: 'POST' }
    )
    const subscribeData = await subscribeRes.json()

    // Fetch subscribed apps again
    const subRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${pageAccessToken}`)
    const subData: any = await subRes.json()

    // 3. Debug the token using the App Access Token
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    
    let tokenDebugData: any = { note: 'Missing App ID or App Secret to debug token' }
    
    if (appId && appSecret) {
      const debugRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${pageAccessToken}&access_token=${appId}|${appSecret}`
      )
      tokenDebugData = await debugRes.json()
    }

    return NextResponse.json({
      success: true,
      page: {
        id: pageId,
        name: pageName,
        username: account.username
      },
      attemptedSubscriptionResponse: subscribeData,
      tokenDebug: tokenDebugData,
      subscribedApps: subData
    })
  } catch (err: any) {
    console.error('Debug endpoint error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
