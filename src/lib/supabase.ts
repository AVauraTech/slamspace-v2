import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton to avoid crashing at build time when env vars are missing
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }
  _client = createClient(url, key)
  return _client
}

// Proxy so callers can write `supabase.from(...)` as usual
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getClient()[prop as keyof SupabaseClient]
  },
})

export type Entry = {
  id: string
  name: string
  message: string
  friendship_level: number
  fav_color: string
  avatar_url: string | null
  signature_data: string | null
  theme: string
  unlock_at: string | null
  room_id: string
  ai_poem: string | null
  ai_compatibility: number | null
  created_at: string
}

export type Memory = {
  id: string
  room_id: string
  content: string
  author: string
  created_at: string
}

export type Room = {
  id: string
  name: string
  owner: string
  created_at: string
}
