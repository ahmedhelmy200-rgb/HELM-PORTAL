import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  })
}

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Supabase service credentials are not configured.")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function requireAdmin(req: Request) {
  const authorization = req.headers.get("Authorization") || ""
  const token = authorization.replace(/^Bearer\s+/i, "").trim()
  if (!token) throw new Response(JSON.stringify({ error: "يلزم تسجيل الدخول." }), { status: 401 })

  const supabase = serviceClient()
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) {
    throw new Response(JSON.stringify({ error: "جلسة الدخول غير صالحة." }), { status: 401 })
  }

  const email = String(user.email || "").toLowerCase()
  let { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!profile && !profileError && email) {
    const fallback = await supabase.from("user_profiles").select("role").ilike("email", email).limit(1).maybeSingle()
    profile = fallback.data
    profileError = fallback.error
  }

  if (profileError || profile?.role !== "admin") {
    throw new Response(JSON.stringify({ error: "هذه العملية متاحة لمدير النظام فقط." }), { status: 403 })
  }

  return { supabase, user }
}

export function handleThrown(error: unknown) {
  if (error instanceof Response) {
    return new Response(error.body, {
      status: error.status,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    })
  }
  const message = error instanceof Error ? error.message : String(error || "حدث خطأ غير متوقع.")
  return json({ error: message }, 500)
}
