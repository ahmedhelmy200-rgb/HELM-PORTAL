import {
  hasSupabaseConfig,
  supabase as cloudSupabase,
  supabaseConfig,
} from '../integrations/supabase/client.js'
import { isDesktopRuntime } from './bridge.js'

const CACHED_SESSION_KEY = 'helm_desktop_cached_supabase_session'
const desktop = isDesktopRuntime()

function readCachedSession() {
  if (!desktop || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHED_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedSession(session) {
  if (!desktop || typeof localStorage === 'undefined' || !session) return
  try {
    localStorage.setItem(CACHED_SESSION_KEY, JSON.stringify(session))
  } catch {}
}

function clearCachedSession() {
  if (!desktop || typeof localStorage === 'undefined') return
  try { localStorage.removeItem(CACHED_SESSION_KEY) } catch {}
}

function isConnectionError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return navigator.onLine === false ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('load failed')
}

const authProxy = new Proxy(cloudSupabase.auth, {
  get(target, property) {
    if (property === 'getSession') {
      return async (...args) => {
        try {
          const result = await target.getSession(...args)
          if (result?.data?.session) writeCachedSession(result.data.session)
          if (!result?.error) return result
          if (!desktop || !isConnectionError(result.error)) return result
        } catch (error) {
          if (!desktop || !isConnectionError(error)) throw error
        }

        const session = readCachedSession()
        return session
          ? { data: { session }, error: null }
          : { data: { session: null }, error: null }
      }
    }

    if (property === 'signOut') {
      return async (...args) => {
        try {
          return await target.signOut(...args)
        } finally {
          clearCachedSession()
        }
      }
    }

    const value = Reflect.get(target, property, target)
    return typeof value === 'function' ? value.bind(target) : value
  },
})

export const supabase = new Proxy(cloudSupabase, {
  get(target, property) {
    if (property === 'auth') return authProxy
    const value = Reflect.get(target, property, target)
    return typeof value === 'function' ? value.bind(target) : value
  },
})

export { hasSupabaseConfig, supabaseConfig }
