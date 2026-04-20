import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

let client = null

export function createClient() {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('Supabase env vars not set')
    return null
  }
  client = supabaseCreateClient(url, key)
  return client
}
