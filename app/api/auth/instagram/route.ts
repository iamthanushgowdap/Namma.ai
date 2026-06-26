import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOAuthUrl } from '@/lib/meta/instagram'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically resolve redirect URI based on current request host
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const redirectUri = `${protocol}://${host}/api/auth/instagram/callback`

    const oauthUrl = getOAuthUrl(redirectUri)
    
    return NextResponse.redirect(oauthUrl)
  } catch (error: any) {
    console.error('OAuth redirect initialization failed:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
