import { createClient } from '@supabase/supabase-js'

const DESKTOP_CONFIG_KEY = 'helm.desktop.supabase.v1'
const isDesktopRuntime = typeof window !== 'undefined' && Boolean(window.helmDesktop?.isDesktop)

const isValidSupabaseUrl = (value) => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(value || '').trim())

function readDesktopConfig() {
  if (!isDesktopRuntime || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DESKTOP_CONFIG_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      url: String(parsed?.url || '').trim(),
      anonKey: String(parsed?.anonKey || '').trim(),
    }
  } catch {
    return {}
  }
}

const envUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const envAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
const desktopConfig = readDesktopConfig()

const supabaseUrl = isValidSupabaseUrl(envUrl) ? envUrl : desktopConfig.url
const supabaseAnonKey = envAnonKey || desktopConfig.anonKey

export const supabaseConfig = {
  url: supabaseUrl,
  hasUrl: isValidSupabaseUrl(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  source: isValidSupabaseUrl(envUrl) && envAnonKey
    ? 'environment'
    : (isDesktopRuntime && desktopConfig.url && desktopConfig.anonKey ? 'desktop' : 'missing'),
  isDesktopRuntime,
}

export const hasSupabaseConfig = supabaseConfig.hasUrl && supabaseConfig.hasAnonKey

export function saveDesktopSupabaseConfig(url, anonKey) {
  if (!isDesktopRuntime || typeof window === 'undefined') {
    throw new Error('إعداد Supabase المحلي متاح فقط في نسخة Windows.')
  }

  const cleanUrl = String(url || '').trim().replace(/\/$/, '')
  const cleanKey = String(anonKey || '').trim()
  if (!isValidSupabaseUrl(cleanUrl)) throw new Error('رابط Supabase غير صحيح.')
  if (!cleanKey) throw new Error('أدخل Supabase anon/public key.')

  window.localStorage.setItem(DESKTOP_CONFIG_KEY, JSON.stringify({
    url: cleanUrl,
    anonKey: cleanKey,
  }))
}

export function clearDesktopSupabaseConfig() {
  if (isDesktopRuntime && typeof window !== 'undefined') {
    window.localStorage.removeItem(DESKTOP_CONFIG_KEY)
  }
}

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
      flowType: 'pkce',
    },
  }
)
