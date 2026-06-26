import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { getInstagramMedia } from '@/lib/meta/instagram'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace ID from query params
    const workspaceId = request.nextUrl.searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
    }

    // 2. Verify workspace ownership
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Forbidden. Workspace isolation mismatch.' }, { status: 403 })
    }

    // 3. Fetch Instagram account credentials for the workspace
    const { data: igAccount, error: igError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('workspace_id', workspace.id)
      .single()

    if (igError || !igAccount) {
      // Return empty list if no connected account
      return NextResponse.json({ media: [] })
    }

    // 4. Decrypt Page Access Token
    const pageAccessToken = decrypt(igAccount.access_token_encrypted)

    // 5. Fetch Instagram media
    const media = await getInstagramMedia(igAccount.instagram_user_id, pageAccessToken)

    return NextResponse.json({ media })
  } catch (err: any) {
    console.error('Fetch Instagram media failed:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch Instagram media' }, { status: 500 })
  }
}
