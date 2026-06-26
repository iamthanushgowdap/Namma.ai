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
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('*')
    .limit(1)
    .single()

  if (!account) {
    console.error('No account found')
    return
  }

  const pageAccessToken = decrypt(account.access_token_encrypted)
  const meRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`)
  const meData: any = await meRes.json()
  
  const pageId = meData.id
  console.log(`Page: ${meData.name} (${pageId})`)

  const subRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${pageAccessToken}`)
  const subData: any = await subRes.json()
  console.log('Subscribed Apps on Page:', JSON.stringify(subData, null, 2))
}

check().catch(console.error)
