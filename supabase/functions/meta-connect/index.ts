import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleThrown, json, requireAdmin } from "../_shared/helm-auth.ts"

const encoder = new TextEncoder()

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const { supabase, user } = await requireAdmin(req)
    const body = await req.json().catch(() => ({}))
    const appId = Deno.env.get("META_APP_ID")
    const redirectUri = Deno.env.get("META_REDIRECT_URI")
    const publicSite = (Deno.env.get("HELM_PUBLIC_SITE_URL") || "https://helm-protal.vercel.app").replace(/\/$/, "")
    const graphVersion = Deno.env.get("META_GRAPH_VERSION") || "v26.0"
    if (!appId || !redirectUri) throw new Error("يلزم ضبط META_APP_ID وMETA_REDIRECT_URI في Supabase Secrets.")

    const requestedPageId = String(body.facebook_page_id || Deno.env.get("META_PAGE_ID") || "").trim()
    const state = randomState()
    const stateHash = await sha256(state)
    const returnUrl = `${publicSite}/SocialPublisher`

    const { error: stateError } = await supabase.from("social_oauth_states").insert({
      state_hash: stateHash,
      requested_by: user.id,
      requested_page_id: requestedPageId || null,
      return_url: returnUrl,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    if (stateError) throw stateError

    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ]
    const extraScopes = String(Deno.env.get("META_EXTRA_SCOPES") || "")
      .split(",").map((scope) => scope.trim()).filter(Boolean)

    const url = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`)
    url.searchParams.set("client_id", appId)
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("state", state)
    url.searchParams.set("response_type", "code")
    const configId = Deno.env.get("META_LOGIN_CONFIG_ID")
    if (configId) {
      url.searchParams.set("config_id", configId)
      url.searchParams.set("override_default_response_type", "true")
    } else {
      url.searchParams.set("scope", [...new Set([...scopes, ...extraScopes])].join(","))
    }

    return json({ authorization_url: url.toString() })
  } catch (error) {
    return handleThrown(error)
  }
})
