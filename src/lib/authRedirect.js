function normalizeHttpOrigin(value) {
  try {
    const url = new URL(String(value || '').trim())
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.origin
  } catch {
    return ''
  }
}

export function getRuntimeWebOrigin() {
  if (typeof window === 'undefined') return ''
  if (!['http:', 'https:'].includes(window.location.protocol)) return ''
  return window.location.origin
}

export function getConfiguredPublicOrigin() {
  return normalizeHttpOrigin(
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL ||
    ''
  )
}

export function isHelmDesktop() {
  return typeof window !== 'undefined' && Boolean(window.helmDesktop?.isDesktop)
}

export function getPublicAppOrigin() {
  const runtimeOrigin = getRuntimeWebOrigin()
  const configuredOrigin = getConfiguredPublicOrigin()

  // Browser deployments must trust the page that is actually open. This prevents
  // a stale localhost value in Vercel env from breaking Google OAuth.
  if (!isHelmDesktop() && runtimeOrigin) return runtimeOrigin

  // Desktop uses the published site for email links when it is configured,
  // while the local 127.0.0.1 origin remains a safe fallback.
  return configuredOrigin || runtimeOrigin
}

export async function beginGoogleOAuth(supabase, options = {}) {
  const queryParams = {
    access_type: 'offline',
    prompt: options.prompt || 'select_account',
    ...(options.queryParams || {}),
  }

  if (isHelmDesktop()) {
    const callbackUrl = await window.helmDesktop.getOAuthCallbackUrl()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
        ...(options.scopes ? { scopes: options.scopes } : {}),
        queryParams,
      },
    })
    if (error) throw error
    if (!data?.url) throw new Error('لم يتم إنشاء رابط Google OAuth.')
    await window.helmDesktop.openExternal(data.url)
    return { desktop: true, redirectTo: callbackUrl }
  }

  const redirectTo = getRuntimeWebOrigin() || getConfiguredPublicOrigin()
  if (!redirectTo) throw new Error('تعذر تحديد عنوان الرجوع بعد تسجيل الدخول.')

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      ...(options.scopes ? { scopes: options.scopes } : {}),
      queryParams,
    },
  })
  if (error) throw error
  return { desktop: false, redirectTo }
}
