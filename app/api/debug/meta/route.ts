import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // 1. Fetch connected Instagram account from DB
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

    let pageAccessToken: string
    try {
      pageAccessToken = decrypt(account.access_token_encrypted)
    } catch (decryptError: any) {
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt access token.',
        message: decryptError.message
      }, { status: 500 })
    }

    // 2. Fetch Page Details & Linked Instagram Account
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account&access_token=${pageAccessToken}`
    )
    const meData: any = await meRes.json()

    if (meData.error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Page details from Meta Graph API.',
        metaError: meData.error
      }, { status: 500 })
    }

    const pageId = meData.id
    const pageName = meData.name
    const linkedIgAccountId = meData.instagram_business_account?.id || null
    const dbIgAccountId = account.instagram_user_id

    const isConnectionMatched = linkedIgAccountId === dbIgAccountId

    // 3. Fetch Page Webhook Subscription Status
    const subRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${pageAccessToken}`
    )
    const subData: any = await subRes.json()

    // 4. Debug Token Scopes & Validity
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    let tokenDebugData: any = { note: 'Missing App ID or App Secret to debug token' }
    let appSubscriptionsData: any = { note: 'Missing App ID or App Secret to fetch App webhook subscriptions' }

    let attemptedUpdateResult: any = null

    if (appId && appSecret) {
      const updateParam = request.nextUrl.searchParams.get('update')
      if (updateParam === 'true') {
        const verifyToken = process.env.META_VERIFY_TOKEN || 'namma_verify_token'
        
        // Update Instagram Webhook Subscriptions
        const paramsIg = new URLSearchParams({
          object: 'instagram',
          callback_url: 'https://namma-ai-topaz.vercel.app/api/webhooks/instagram',
          fields: 'comments,messages,messaging_postbacks',
          verify_token: verifyToken,
          access_token: `${appId}|${appSecret}`
        })
        const updateIgRes = await fetch(
          `https://graph.facebook.com/v21.0/${appId}/subscriptions`,
          { method: 'POST', body: paramsIg }
        )
        const updateIgData = await updateIgRes.json()

        // Update Page Webhook Subscriptions
        const paramsPage = new URLSearchParams({
          object: 'page',
          callback_url: 'https://namma-ai-topaz.vercel.app/api/webhooks/instagram',
          fields: 'feed,mention',
          verify_token: verifyToken,
          access_token: `${appId}|${appSecret}`
        })
        const updatePageRes = await fetch(
          `https://graph.facebook.com/v21.0/${appId}/subscriptions`,
          { method: 'POST', body: paramsPage }
        )
        const updatePageData = await updatePageRes.json()

        attemptedUpdateResult = {
          instagram: updateIgData,
          page: updatePageData
        }

        // CRITICAL: Subscribe the Page itself to deliver comment/message events
        // This is SEPARATE from App-level subscriptions above.
        // Without this, Meta knows the app CAN receive events but won't DELIVER them for this Page.
        const pageSubParams = new URLSearchParams({
          subscribed_fields: 'feed,mention',
          access_token: pageAccessToken
        })
        const pageSubRes = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
          { method: 'POST', body: pageSubParams }
        )
        const pageSubData = await pageSubRes.json()

        attemptedUpdateResult.pageSubscribedApps = pageSubData
      }

      // Get token details
      const debugRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${pageAccessToken}&access_token=${appId}|${appSecret}`
      )
      tokenDebugData = await debugRes.json()

      // Get App-level Webhook Subscriptions (verifies if comments/messages are subscribed at app level)
      const appSubRes = await fetch(
        `https://graph.facebook.com/v21.0/${appId}/subscriptions?access_token=${appId}|${appSecret}`
      )
      appSubscriptionsData = await appSubRes.json()
    }

    // Fetch the connected Instagram account's recent media (to verify correct posts)
    let igMediaData: any = { note: 'Could not fetch media' }
    try {
      const igMediaRes = await fetch(
        `https://graph.facebook.com/v21.0/${linkedIgAccountId || dbIgAccountId}/media?fields=id,permalink,caption,timestamp&limit=5&access_token=${pageAccessToken}`
      )
      igMediaData = await igMediaRes.json()
    } catch (e) {}

    // Check App feature access levels (Advanced vs Standard)
    let appFeaturesData: any = null
    if (appId && appSecret) {
      try {
        const featuresRes = await fetch(
          `https://graph.facebook.com/v21.0/${appId}?fields=permissions&access_token=${appId}|${appSecret}`
        )
        appFeaturesData = await featuresRes.json()
      } catch (e) {}
    }
  
    return NextResponse.json({
      success: true,
      appId: appId || 'Not configured',
      pageConnection: {
        pageId,
        pageName,
        databaseInstagramUsername: account.username,
        linkedInstagramBusinessAccountId: linkedIgAccountId,
        databaseInstagramUserId: dbIgAccountId,
        isConnectionMatched
      },
      tokenPermissionStatus: {
        isValid: tokenDebugData.data?.is_valid || false,
        scopes: tokenDebugData.data?.scopes || [],
        granularScopes: tokenDebugData.data?.granular_scopes || [],
        expiresAt: tokenDebugData.data?.expires_at 
          ? new Date(tokenDebugData.data.expires_at * 1000).toISOString() 
          : 'Never',
        issuedAt: tokenDebugData.data?.issued_at 
          ? new Date(tokenDebugData.data.issued_at * 1000).toISOString() 
          : 'Unknown'
      },
      attemptedAppSubscriptionUpdate: attemptedUpdateResult,
      pageWebhookSubscription: subData.data || [],
      appWebhookSubscriptions: appSubscriptionsData.data || [],
      connectedAccountMedia: igMediaData.data || igMediaData,
      appFeatures: appFeaturesData
    })

  } catch (err: any) {
    console.error('Meta debug endpoint error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
