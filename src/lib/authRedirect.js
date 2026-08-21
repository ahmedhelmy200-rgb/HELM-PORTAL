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

export function getPublicAppOrigin() {
  // On a real browser deployment, always trust the page that is actually open.
  // This prevents a stale localhost value in Vercel env from breaking Google OAuth.
  return getRuntimeWebOrigin() || getConfiguredPublicOrigin()
}

export function isHelmDesktop() {
  return typeof window !== 'undefined' && Boolean(window.helmDesktop?.isDesktop)
}

export async function beginGoogleOAuth(supabase) {
  const queryParams = { access_type: 'offline', prompt: 'select_account' }

  if (isHelmDesktop()) {
    const callbackUrl = await window.helmDesktop.getOAuthCallbackUrl()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
        queryParams,
      },
    })
    if (error) throw error
    if (!data?.url) throw new Error('لم يتم إنشاء رابط Google OAuth.')
    await window.helmDesktop.openExternal(data.url)
    return { desktop: true, redirectTo: callbackUrl }
  }

  const redirectTo = getPublicAppOrigin()
  if (!redirectTo) throw new Error('تعذر تحديد عنوان الرجوع بعد تسجيل الدخول.')

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams },
  })
  if (error) throw error
  return { desktop: false, redirectTo }
}
