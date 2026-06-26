import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { sendInstagramMessage } from '@/lib/meta/messages'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content } = await request.json()

    if (!conversationId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Missing conversationId or message content' }, { status: 400 })
    }

    // 2. Fetch conversation and verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check workspace isolation
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', conversation.workspace_id)
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
      return NextResponse.json({ error: 'Instagram account connection not found for workspace' }, { status: 400 })
    }

    // 4. Decrypt Page Access Token
    const pageAccessToken = decrypt(igAccount.access_token_encrypted)

    // 5. Send message via Meta Graph API
    await sendInstagramMessage(
      conversation.instagram_user_id,
      content.trim(),
      pageAccessToken
    )

    // 6. Log the outbound message to Supabase
    const { data: messageRecord, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: 'user',
        content: content.trim(),
      })
      .select()
      .single()

    if (msgError) throw msgError

    return NextResponse.json({ success: true, message: messageRecord })
  } catch (err: any) {
    console.error('Outbound message execution failed:', err)
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 })
  }
}
