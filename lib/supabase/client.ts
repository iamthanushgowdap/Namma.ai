import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  console.log('--- Supabase Client Initialization ---');
  console.log('Supabase URL:', supabaseUrl);
  if (supabaseAnonKey === 'placeholder-anon-key') {
    console.warn('WARNING: Using placeholder anon key!');
  }
  console.log('--------------------------------------');

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
