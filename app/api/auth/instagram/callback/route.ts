import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  exchangeCodeForToken,
  getConnectedInstagramAccounts,
} from '@/lib/meta/instagram'
import { encrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Redirect target back to the connections dashboard page
  const getRedirectUrl = (params: string) => {
    const origin = request.nextUrl.origin
    return `${origin}/dashboard/connections?${params}`
  }

  if (error) {
    console.error('Meta OAuth callback returned error:', error)
    return NextResponse.redirect(getRedirectUrl(`error=${encodeURIComponent(error)}`))
  }

  if (!code) {
    return NextResponse.redirect(getRedirectUrl('error=Missing authorization code'))
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(getRedirectUrl('error=Authentication required'))
    }

    // 1. Get user's primary workspace
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)

    if (workspaceError || !workspaces || workspaces.length === 0) {
      return NextResponse.redirect(getRedirectUrl('error=No workspace found for your profile'))
    }

    const workspaceId = workspaces[0].id

    // 2. Resolve the redirect URI dynamically to match the Facebook configuration
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const redirectUri = `${protocol}://${host}/api/auth/instagram/callback`

    // 3. Exchange code for a long-lived Meta User Access Token
    const longLivedUserToken = await exchangeCodeForToken(code, redirectUri)
    console.log(`[OAuth Callback] Long-lived token type: ${longLivedUserToken.startsWith('IG') ? 'Direct Instagram (IG)' : longLivedUserToken.startsWith('EAA') ? 'Facebook Page (EAA)' : 'Unknown'} | Token prefix: ${longLivedUserToken.substring(0, 10)}...`)

    // 4. Retrieve Instagram Professional Account info
    const igAccounts = await getConnectedInstagramAccounts(longLivedUserToken)

    if (igAccounts.length === 0) {
      return NextResponse.redirect(getRedirectUrl('error=No Instagram Professional Accounts found connected. Please check your settings.'))
    }

    // 5. Connect all found Instagram accounts
    for (const account of igAccounts) {
      console.log(`[OAuth Callback] Storing token for @${account.username} (ID: ${account.instagramUserId}) | Token type: ${account.pageAccessToken.startsWith('IG') ? 'Direct Instagram (IG)' : account.pageAccessToken.startsWith('EAA') ? 'Facebook Page (EAA)' : 'Unknown'} | Token prefix: ${account.pageAccessToken.substring(0, 10)}...`)
      const encryptedToken = encrypt(account.pageAccessToken)

      // Upsert record in database
      const { error: upsertError } = await supabase
        .from('instagram_accounts')
        .upsert({
          workspace_id: workspaceId,
          instagram_user_id: account.instagramUserId,
          username: account.username,
          access_token_encrypted: encryptedToken,
          connected_at: new Date().toISOString(),
        }, {
          onConflict: 'instagram_user_id',
        })

      if (upsertError) {
        console.error('Failed to store Instagram account in DB:', upsertError)
        continue
      }
    }

    return NextResponse.redirect(getRedirectUrl(`success=true&count=${igAccounts.length}`))
  } catch (err: any) {
    console.error('OAuth Callback handling failed:', err)
    return NextResponse.redirect(getRedirectUrl(`error=${encodeURIComponent(err.message || 'OAuth exchange failed')}`))
  }
}
