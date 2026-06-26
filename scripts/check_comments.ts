import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { decrypt } from '../lib/crypto'

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=')
      const key = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  console.log('=== PART 1: Check Recent Webhook Events in DB ===')
  const { data: events, error: evError } = await supabase
    .from('webhook_events')
    .select('id, event_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (evError) {
    console.error('Error fetching webhook events:', evError)
  } else {
    console.log('Recent webhook events:')
    for (const ev of events || []) {
      console.log(`  [${ev.created_at}] ${ev.event_type} (id: ${ev.id})`)
    }
  }

  console.log('\n=== PART 2: Check All Comments on All Posts via Graph API ===')
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('*')
    .limit(1)
    .single()

  if (!account) {
    console.error('No account found')
    return
  }

  const accessToken = decrypt(account.access_token_encrypted)

  // Fetch all media
  const mediaRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.instagram_user_id}/media?fields=id,permalink,timestamp&access_token=${accessToken}`
  )
  const mediaData: any = await mediaRes.json()

  if (mediaData.error) {
    console.error('Failed to fetch media:', mediaData.error)
    return
  }

  for (const media of mediaData.data || []) {
    console.log(`\nPost: ${media.permalink} (ID: ${media.id})`)
    
    const commentsRes = await fetch(
      `https://graph.facebook.com/v19.0/${media.id}/comments?fields=id,text,from,timestamp&access_token=${accessToken}`
    )
    const commentsData: any = await commentsRes.json()
    
    if (commentsData.error) {
      console.log(`  Error fetching comments: ${commentsData.error.message}`)
      continue
    }

    const comments = commentsData.data || []
    if (comments.length === 0) {
      console.log('  No comments found')
    } else {
      for (const c of comments) {
        console.log(`  [${c.timestamp}] "${c.text}" by ${c.from?.username || 'unknown'} (user_id: ${c.from?.id || 'N/A'}, comment_id: ${c.id})`)
      }
    }
  }

  console.log('\n=== PART 3: Check Active Automations ===')
  const { data: automations } = await supabase
    .from('automations')
    .select('*, automation_rules(*)')
    .eq('status', 'active')

  if (!automations || automations.length === 0) {
    console.log('NO ACTIVE AUTOMATIONS FOUND! This would explain why comments are not processed.')
  } else {
    for (const auto of automations) {
      console.log(`Automation: "${auto.name}" (status: ${auto.status}, media_id: ${auto.media_id || 'ALL POSTS'})`)
      for (const rule of auto.automation_rules || []) {
        console.log(`  Rule: keyword="${rule.keyword}" -> response="${rule.response_message}"`)
      }
    }
  }
}

check().catch(console.error)
