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

async function test() {
  console.log('--- STARTING END-TO-END WEBHOOK SIMULATION TEST ---')
  
  // 1. Fetch connected Instagram account
  const { data: account, error: accError } = await supabase
    .from('instagram_accounts')
    .select('*')
    .limit(1)
    .single()

  if (accError || !account) {
    console.error('No connected Instagram account found in DB:', accError)
    return
  }

  console.log(`Found Instagram Account: ${account.username} (${account.instagram_user_id})`)
  
  let accessToken: string
  try {
    accessToken = decrypt(account.access_token_encrypted)
    console.log('Access token successfully decrypted.')
  } catch (err) {
    console.error('Failed to decrypt access token.')
    return
  }

  // 2. Fetch recent media posts to get media list
  console.log('Fetching recent media posts from Instagram Graph API...')
  const mediaRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.instagram_user_id}/media?fields=id,permalink&access_token=${accessToken}`
  )
  const mediaData: any = await mediaRes.json()

  if (mediaData.error) {
    console.error('Failed to fetch media:', mediaData.error)
    return
  }

  const mediaList = mediaData.data || []
  if (mediaList.length === 0) {
    console.log('No media posts found on the Instagram account. Please post something first.')
    return
  }

  console.log(`Found ${mediaList.length} media posts. Searching for comments...`)

  let targetMedia = null
  let targetComment = null

  // 3. Loop through media posts to find comments
  for (const media of mediaList) {
    console.log(`Checking comments for media ID ${media.id} (${media.permalink})...`)
    const commentsRes = await fetch(
      `https://graph.facebook.com/v19.0/${media.id}/comments?fields=id,text,from&access_token=${accessToken}`
    )
    const commentsData: any = await commentsRes.json()

    if (commentsData.error) {
      console.warn(`Failed to fetch comments for media ${media.id}:`, commentsData.error.message)
      continue
    }

    const commentsList = commentsData.data || []
    if (commentsList.length > 0) {
      targetMedia = media
      // Try to find a comment with a keyword, otherwise take the first one
      targetComment = commentsList.find((c: any) => 
        c.text.toLowerCase().includes('price') || c.text.toLowerCase().includes('link')
      ) || commentsList[0]
      break
    }
  }

  if (!targetMedia || !targetComment) {
    console.log('--- No comments found on any post. ---')
    console.log('Please leave a comment like "price" or "Link" on one of your posts, then re-run this script.')
    return
  }

  console.log(`\nFound Comment!`)
  console.log(`Media: ${targetMedia.permalink} (ID: ${targetMedia.id})`)
  console.log(`Comment: "${targetComment.text}" (ID: ${targetComment.id}) from User ID: ${targetComment.from?.id || 'unknown'}`)

  // 4. Construct simulated webhook payload
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: account.instagram_user_id,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: 'comments',
            value: {
              id: targetComment.id,
              text: targetComment.text,
              from: {
                id: targetComment.from?.id || '1234567890',
                username: targetComment.from?.username || 'tester_user'
              },
              media: {
                id: targetMedia.id,
                media_product_type: 'FEED'
              }
            }
          }
        ]
      }
    ]
  }

  // 5. Send POST request locally to the webhook endpoint
  console.log('\nSending webhook POST payload to localhost:3000...')
  const webhookRes = await fetch('http://localhost:3000/api/webhooks/instagram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const resultText = await webhookRes.text()
  console.log(`Webhook HTTP Response Status: ${webhookRes.status}`)
  console.log(`Webhook HTTP Response Body: ${resultText}`)
}

test().catch(console.error)
