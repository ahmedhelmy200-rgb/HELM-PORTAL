import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleThrown, json, serviceClient } from "../_shared/helm-auth.ts"
import { loadActiveMetaConnection, publishToMeta } from "../_shared/meta.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const expected = Deno.env.get("META_CRON_SECRET")
    const supplied = req.headers.get("x-cron-secret")
    if (!expected || supplied !== expected) return json({ error: "Unauthorized" }, 401)

    const supabase = serviceClient()
    const { connection, pageAccessToken } = await loadActiveMetaConnection(supabase)
    const { data: posts, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10)
    if (error) throw error

    const processed = []
    for (const post of posts || []) {
      const { data: claimed } = await supabase.from("social_posts")
        .update({ status: "publishing", error_message: null })
        .eq("id", post.id).eq("status", "scheduled")
        .select("id").maybeSingle()
      if (!claimed) continue

      try {
        const outcome = await publishToMeta(supabase, connection, pageAccessToken, post)
        const publishedCount = Object.keys(outcome.results).length
        const status = outcome.errors.length === 0 ? "published" : publishedCount > 0 ? "partially_published" : "failed"
        await supabase.from("social_posts").update({
          status,
          provider_results: outcome.results,
          error_message: outcome.errors.join("\n") || null,
          published_at: publishedCount ? new Date().toISOString() : null,
        }).eq("id", post.id)
        processed.push({ id: post.id, status })
      } catch (postError) {
        const message = postError instanceof Error ? postError.message : String(postError)
        await supabase.from("social_posts").update({ status: "failed", error_message: message }).eq("id", post.id)
        processed.push({ id: post.id, status: "failed" })
      }
    }

    return json({ processed })
  } catch (error) {
    return handleThrown(error)
  }
})
