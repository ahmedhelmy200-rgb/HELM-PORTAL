import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { serviceClient } from "../_shared/helm-auth.ts"

const encoder = new TextEncoder()

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function redirectWith(url: string, params: Record<string, string>) {
  const target = new URL(url)
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value))
  return Response.redirect(target.toString(), 302)
}

async function graphGet(path: string, params: Record<string, string>, accessToken?: string) {
  const version = Deno.env.get("META_GRAPH_VERSION") || "v26.0"
  const url = new URL(`https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, accessToken ? { headers: { "Authorization": `Bearer ${accessToken}` } } : undefined)
  const result = await response.json()
  if (!response.ok || result?.error) throw new Error(result?.error?.message || `Meta API error (${response.status})`)
  return result
}

serve(async (req) => {
  const supabase = serviceClient()
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get("code")
  const state = requestUrl.searchParams.get("state")
  const oauthError = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error")
  const fallback = `${(Deno.env.get("HELM_PUBLIC_SITE_URL") || "https://helm-protal.vercel.app").replace(/\/$/, "")}/SocialPublisher`

  if (!state) return redirectWith(fallback, { meta: "error", message: "OAuth state is missing" })

  const stateHash = await sha256(state)
  const { data: stateRow, error: stateError } = await supabase
    .from("social_oauth_states")
    .select("state_hash, requested_by, requested_page_id, return_url, expires_at")
    .eq("state_hash", stateHash)
    .maybeSingle()
  if (stateError || !stateRow || new Date(stateRow.expires_at).getTime() < Date.now()) {
    return redirectWith(fallback, { meta: "error", message: "انتهت صلاحية طلب الربط. أعد المحاولة." })
  }

  const { error: deleteStateError } = await supabase.from("social_oauth_states").delete().eq("state_hash", stateHash)
  if (deleteStateError) return redirectWith(stateRow.return_url, { meta: "error", message: "تعذر تأمين طلب الربط. أعد المحاولة." })
  if (oauthError || !code) return redirectWith(stateRow.return_url, { meta: "error", message: oauthError || "لم يكتمل تفويض Meta." })

  try {
    const appId = Deno.env.get("META_APP_ID")
    const appSecret = Deno.env.get("META_APP_SECRET")
    const redirectUri = Deno.env.get("META_REDIRECT_URI")
    if (!appId || !appSecret || !redirectUri) throw new Error("إعدادات تطبيق Meta غير مكتملة.")

    const shortToken = await graphGet("oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    })
    const longToken = await graphGet("oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken.access_token,
    })
    const userToken = longToken.access_token || shortToken.access_token

    const pages = await graphGet("me/accounts", {
      fields: "id,name,access_token,instagram_business_account{id,username,name}",
      limit: "100",
    }, userToken)
    const page = stateRow.requested_page_id
      ? pages.data?.find((item: { id: string }) => item.id === stateRow.requested_page_id)
      : pages.data?.[0]
    if (!page?.id || !page?.access_token) {
      throw new Error("لم يعثر التفويض على صفحة المكتب. تأكد أن الحساب يملك تحكمًا كاملًا بالصفحة.")
    }

    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + Number(longToken.expires_in) * 1000).toISOString()
      : null
    const grantedScopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish"]

    const { data: connection, error: connectionError } = await supabase
      .from("social_connections")
      .upsert({
        provider: "meta",
        connected_by: stateRow.requested_by,
        facebook_page_id: page.id,
        facebook_page_name: page.name || null,
        instagram_business_id: page.instagram_business_account?.id || null,
        instagram_username: page.instagram_business_account?.username || null,
        granted_scopes: grantedScopes,
        token_expires_at: expiresAt,
        is_active: true,
        connected_at: new Date().toISOString(),
      }, { onConflict: "provider" })
      .select("id")
      .single()
    if (connectionError) throw connectionError

    const { error: secretError } = await supabase.from("social_connection_secrets").upsert({
      connection_id: connection.id,
      page_access_token: page.access_token,
      updated_at: new Date().toISOString(),
    })
    if (secretError) throw secretError

    return redirectWith(stateRow.return_url, { meta: "connected" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return redirectWith(stateRow.return_url, { meta: "error", message })
  }
})
