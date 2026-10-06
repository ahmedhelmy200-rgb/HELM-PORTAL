import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleThrown, json, requireAdmin } from "../_shared/helm-auth.ts"
import { loadActiveMetaConnection, publishToMeta } from "../_shared/meta.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const { supabase, user } = await requireAdmin(req)
    const body = await req.json()
    const caption = String(body.caption || "").trim()
    const mediaBucket = body.media_bucket ? String(body.media_bucket) : null
    const mediaPath = body.media_path ? String(body.media_path) : null
    const targets = Array.isArray(body.targets)
      ? [...new Set(body.targets.filter((target: string) => ["facebook", "instagram"].includes(target)))]
      : ["facebook"]
    const instagramPlacement = body.instagram_placement === "feed" ? "feed" : "story"
    if (!targets.length) return json({ error: "اختر منصة واحدة على الأقل." }, 400)
    if (!caption && !mediaPath) return json({ error: "أضف نصًا أو صورة للمنشور." }, 400)
    if (targets.includes("instagram") && !mediaPath) return json({ error: "Instagram يتطلب صورة." }, 400)

    const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null
    const isScheduled = scheduledAt && !Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now() + 30_000
    const { data: post, error: insertError } = await supabase.from("social_posts").insert({
      created_by: user.id,
      caption,
      media_bucket: mediaBucket,
      media_path: mediaPath,
      targets,
      instagram_placement: instagramPlacement,
      status: isScheduled ? "scheduled" : "publishing",
      scheduled_at: isScheduled ? scheduledAt.toISOString() : null,
    }).select("*").single()
    if (insertError) throw insertError
    if (isScheduled) return json({ post, scheduled: true })

    const { connection, pageAccessToken } = await loadActiveMetaConnection(supabase)
    const outcome = await publishToMeta(supabase, connection, pageAccessToken, post)
    const publishedCount = Object.keys(outcome.results).length
    const status = outcome.errors.length === 0 ? "published" : publishedCount > 0 ? "partially_published" : "failed"
    const { data: updated, error: updateError } = await supabase.from("social_posts").update({
      status,
      provider_results: outcome.results,
      error_message: outcome.errors.join("\n") || null,
      published_at: publishedCount ? new Date().toISOString() : null,
    }).eq("id", post.id).select("*").single()
    if (updateError) throw updateError

    return json({ post: updated, errors: outcome.errors }, outcome.errors.length && !publishedCount ? 502 : 200)
  } catch (error) {
    return handleThrown(error)
  }
})
