import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import { base44 } from '@/api/base44Client'
import { loginWithCalendarScope } from '@/lib/googleCalendar'
import { supabase } from '@/integrations/supabase/client'

const AuthContext = createContext()

const AUTH_TIMEOUT_MS = 12000
const PROFILE_TIMEOUT_MS = 12000
const SETTINGS_TIMEOUT_MS = 8000
const TAB_RECHECK_DEBOUNCE_MS = 350

function isAbortLike(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('timeout') || message.includes('network') || message.includes('fetch') || message.includes('abort')
}

function withTimeout(promise, ms, label) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    }),
  ]).finally(() => window.clearTimeout(timer))
}

export const AuthProvider = ({ children }) => {
  const [user,                    setUser]                    = useState(null)
  const [isAuthenticated,         setIsAuthenticated]         = useState(false)
  const [isLoadingAuth,           setIsLoadingAuth]           = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError,               setAuthError]               = useState(null)
  const [appPublicSettings,       setAppPublicSettings]       = useState(null)

  const checkingRef = useRef(false)
  const checkIdRef = useRef(0)
  const tabRecheckTimerRef = useRef(null)

  const clearBase44Cache = useCallback(() => {
    try { base44.__clearCache?.() } catch {}
  }, [])

  const finishAsGuest = useCallback((error = null) => {
    setUser(null)
    setIsAuthenticated(false)
    setAppPublicSettings(null)
    if (error) setAuthError(error)
  }, [])

  const checkAppState = useCallback(async (options = {}) => {
    const { silent = false, force = false } = options || {}

    // منع تكديس طلبات الفحص؛ الفحص القسري يستخدم عند الرجوع للتبويب أو بعد تسجيل الدخول.
    if (checkingRef.current && !force) return { ok: false, skipped: true }

    const checkId = ++checkIdRef.current
    checkingRef.current = true

    if (!silent) {
      setIsLoadingAuth(true)
      setIsLoadingPublicSettings(false)
    }

    try {
      setAuthError(null)

      const { data: sessionData, error: sessionErr } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT_MS,
        'auth session'
      )

      if (checkId !== checkIdRef.current) return { ok: false, stale: true }

      if (sessionErr) throw sessionErr

      if (!sessionData?.session) {
        clearBase44Cache()
        finishAsGuest(null)
        return { ok: true, authenticated: false }
      }

      clearBase44Cache()
      if (!silent) setIsLoadingPublicSettings(true)

      const currentUser = await withTimeout(
        base44.auth.me(),
        PROFILE_TIMEOUT_MS,
        'user profile'
      )

      if (checkId !== checkIdRef.current) return { ok: false, stale: true }

      const settingsRows = currentUser?.role === 'pending_client'
        ? []
        : await withTimeout(
            base44.entities.OfficeSettings.list().catch(() => []),
            SETTINGS_TIMEOUT_MS,
            'office settings'
          )

      if (checkId !== checkIdRef.current) return { ok: false, stale: true }

      setAppPublicSettings(settingsRows?.[0] || null)
      setUser(currentUser)
      setIsAuthenticated(true)
      setAuthError(null)
      return { ok: true, authenticated: true }
    } catch (error) {
      console.error('[Auth] checkAppState failed:', error)

      if (checkId !== checkIdRef.current) return { ok: false, stale: true }

      const msg     = error?.message || ''
      const isNoReg = msg.includes('registered') || msg.includes('not found') || msg.includes('user_profiles')
      const isConn  = isAbortLike(error)

      clearBase44Cache()
      finishAsGuest({
        type: isNoReg ? 'user_not_registered'
            : isConn  ? 'network_error'
            : 'auth_required',
        message: isNoReg ? 'حسابك غير مسجّل في النظام. تواصل مع مدير المكتب.'
                : isConn  ? 'تعذر استكمال فحص الجلسة. أعد المحاولة أو سجل الدخول مرة أخرى.'
                : msg || 'تعذر التحقق من الهوية.',
      })
      return { ok: false, error }
    } finally {
      if (checkId === checkIdRef.current) {
        checkingRef.current = false
        setIsLoadingAuth(false)
        setIsLoadingPublicSettings(false)
      }
    }
  }, [clearBase44Cache, finishAsGuest])

  const scheduleSilentRecheck = useCallback(() => {
    window.clearTimeout(tabRecheckTimerRef.current)
    tabRecheckTimerRef.current = window.setTimeout(() => {
      clearBase44Cache()
      checkAppState({ silent: true, force: true })
    }, TAB_RECHECK_DEBOUNCE_MS)
  }, [checkAppState, clearBase44Cache])

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash   = window.location.hash
      const search = window.location.search
      const hasToken = hash.includes('access_token') || hash.includes('refresh_token')
      const hasCode  = search.includes('code=')

      if (hasToken || hasCode) {
        await new Promise(r => window.setTimeout(r, 600))
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      await checkAppState({ force: true })
    }

    handleOAuthCallback()

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      console.log('[Auth] event:', event)

      // مهم: لا نستدعي Supabase مباشرة داخل callback حتى لا يحدث تعليق عند الرجوع للتبويب.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        window.setTimeout(() => {
          clearBase44Cache()
          checkAppState({ silent: event !== 'SIGNED_IN', force: true })
        }, 0)
      } else if (event === 'SIGNED_OUT') {
        clearBase44Cache()
        setUser(null)
        setIsAuthenticated(false)
        setAppPublicSettings(null)
        setAuthError(null)
        setIsLoadingAuth(false)
        setIsLoadingPublicSettings(false)
      }
    })

    return () => {
      window.clearTimeout(tabRecheckTimerRef.current)
      sub?.subscription?.unsubscribe()
    }
  }, [checkAppState, clearBase44Cache])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') scheduleSilentRecheck()
    }
    const handlePageShow = () => scheduleSilentRecheck()
    const handleFocus = () => scheduleSilentRecheck()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
    }
  }, [scheduleSilentRecheck])

  const logout = async (shouldRedirect = true) => {
    clearBase44Cache()
    return base44.auth.logout(shouldRedirect ? window.location.origin : null)
  }

  const navigateToLoginWithCalendar = async () => {
    try { await loginWithCalendarScope(import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || window.location.origin) }
    catch (err) { setAuthError({ type: 'oauth_error', message: err.message }) }
  }

  const navigateToLogin = async () => {
    try {
      setAuthError(null)
      const redirectTo = (
        import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL ||
        window.location.origin
      ).replace(/\/$/, '')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      })
      if (error) {
        setAuthError({ type: 'oauth_error', message: error.message || 'فشل الاتصال بـ Google.' })
      }
    } catch (err) {
      setAuthError({ type: 'oauth_error', message: err.message || 'تعذر الاتصال بـ Google OAuth.' })
    }
  }

  const signInWithEmail = async (email, password) => {
    try {
      setAuthError(null)
      const cleanEmail = String(email || '').trim().toLowerCase()
      if (!cleanEmail || !password) throw new Error('أدخل البريد الإلكتروني وكلمة المرور.')

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) throw error
      clearBase44Cache()
      await checkAppState({ force: true })
      return { ok: true }
    } catch (err) {
      const message = err?.message?.includes('Invalid login credentials')
        ? 'بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.'
        : err?.message || 'تعذر تسجيل الدخول بالإيميل وكلمة المرور.'
      setAuthError({ type: 'email_login_error', message })
      return { ok: false, error: message }
    }
  }

  const signUpWithEmail = async ({ email, password, fullName }) => {
    try {
      setAuthError(null)
      const cleanEmail = String(email || '').trim().toLowerCase()
      const cleanName = String(fullName || '').trim()
      if (!cleanEmail || !password) throw new Error('أدخل البريد الإلكتروني وكلمة المرور.')
      if (password.length < 6) throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف.')

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName || cleanEmail },
          emailRedirectTo: import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin,
        },
      })

      if (error) throw error
      clearBase44Cache()
      await checkAppState({ force: true })
      return { ok: true }
    } catch (err) {
      const message = err?.message || 'تعذر إنشاء الحساب بالإيميل وكلمة المرور.'
      setAuthError({ type: 'email_signup_error', message })
      return { ok: false, error: message }
    }
  }

  const resetPasswordForEmail = async (email) => {
    try {
      setAuthError(null)
      const cleanEmail = String(email || '').trim().toLowerCase()
      if (!cleanEmail) throw new Error('أدخل البريد الإلكتروني أولاً.')
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${(import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')}/PasswordReset`,
      })
      if (error) throw error
      return { ok: true }
    } catch (err) {
      const message = err?.message || 'تعذر إرسال رابط إعادة تعيين كلمة المرور.'
      setAuthError({ type: 'password_reset_error', message })
      return { ok: false, error: message }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      navigateToLoginWithCalendar,
      signInWithEmail,
      signUpWithEmail,
      resetPasswordForEmail,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
