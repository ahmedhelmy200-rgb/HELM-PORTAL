import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const isValidSupabaseUrl = (value) => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(value || '').trim())

export const supabaseConfig = {
  url: supabaseUrl,
  hasUrl: isValidSupabaseUrl(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
}

export const hasSupabaseConfig = supabaseConfig.hasUrl && supabaseConfig.hasAnonKey

if (!hasSupabaseConfig) {
  console.warn('[supabase] Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl : 'https://example.supabase.co',
  hasSupabaseConfig ? supabaseAnonKey : 'missing',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
