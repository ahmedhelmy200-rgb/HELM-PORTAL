import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export type SocialPost = {
  id: string
  caption: string
  media_bucket: string | null
  media_path: string | null
  targets: string[]
  instagram_placement: "feed" | "story"
}

export type MetaConnection = {
  id: string
  facebook_page_id: string
  instagram_business_id: string | null
}

const graphVersion = () => Deno.env.get("META_GRAPH_VERSION") || "v26.0"

async function graphRequest(path: string, accessToken: string, params: Record<string, string>, method = "POST") {
  const url = new URL(`https://graph.facebook.com/${graphVersion()}/${path.replace(/^\//, "")}`)
  const body = new URLSearchParams(params)
  let response: Response

  if (method === "GET") {
    body.forEach((value, key) => url.searchParams.set(key, value))
    response = await fetch(url, { method: "GET", headers: { "Authorization": `Bearer ${accessToken}` } })
  } else {
    response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
  }

  const result = await response.json()
  if (!response.ok || result?.error) {
    const message = result?.error?.message || `Meta API request failed (${response.status}).`
    const code = result?.error?.code ? ` [${result.error.code}]` : ""
    throw new Error(`${message}${code}`)
  }
  return result
}

async function signedMediaUrl(supabase: SupabaseClient, post: SocialPost) {
  if (!post.media_bucket || !post.media_path) return null
  const { data, error } = await supabase.storage
    .from(post.media_bucket)
    .createSignedUrl(post.media_path, 3600)
  if (error || !data?.signedUrl) throw new Error(error?.message || "تعذر تجهيز رابط الصورة للنشر.")
  return data.signedUrl
}

async function waitForInstagramContainer(containerId: string, accessToken: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const status = await graphRequest(containerId, accessToken, { fields: "status_code" }, "GET")
    if (status.status_code === "FINISHED") return
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`تعذر تجهيز منشور Instagram: ${status.status_code}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1200))
  }
  throw new Error("استغرق تجهيز منشور Instagram وقتًا أطول من المتوقع. أعد المحاولة.")
}

export async function publishToMeta(
  supabase: SupabaseClient,
  connection: MetaConnection,
  pageAccessToken: string,
  post: SocialPost,
) {
  const mediaUrl = await signedMediaUrl(supabase, post)
  const results: Record<string, unknown> = {}
  const errors: string[] = []

  if (post.targets.includes("facebook")) {
    try {
      results.facebook = mediaUrl
        ? await graphRequest(`${connection.facebook_page_id}/photos`, pageAccessToken, {
            url: mediaUrl,
            caption: post.caption || "",
            published: "true",
          })
        : await graphRequest(`${connection.facebook_page_id}/feed`, pageAccessToken, {
            message: post.caption,
          })
    } catch (error) {
      errors.push(`Facebook: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (post.targets.includes("instagram")) {
    try {
      if (!connection.instagram_business_id) throw new Error("لا يوجد حساب Instagram احترافي مرتبط بالصفحة.")
      if (!mediaUrl) throw new Error("Instagram يتطلب صورة للمنشور.")
      const instagramParams: Record<string, string> = { image_url: mediaUrl }
      if (post.instagram_placement === "story") instagramParams.media_type = "STORIES"
      else instagramParams.caption = post.caption || ""
      const container = await graphRequest(`${connection.instagram_business_id}/media`, pageAccessToken, instagramParams)
      await waitForInstagramContainer(container.id, pageAccessToken)
      results.instagram = await graphRequest(`${connection.instagram_business_id}/media_publish`, pageAccessToken, {
        creation_id: container.id,
      })
    } catch (error) {
      errors.push(`Instagram: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { results, errors }
}

export async function loadActiveMetaConnection(supabase: SupabaseClient) {
  const { data: connection, error: connectionError } = await supabase
    .from("social_connections")
    .select("id, facebook_page_id, instagram_business_id")
    .eq("provider", "meta")
    .eq("is_active", true)
    .maybeSingle()
  if (connectionError) throw connectionError
  if (!connection) throw new Error("لم يتم ربط Meta بالمكتب بعد.")

  const { data: secret, error: secretError } = await supabase
    .from("social_connection_secrets")
    .select("page_access_token")
    .eq("connection_id", connection.id)
    .maybeSingle()
  if (secretError) throw secretError
  if (!secret?.page_access_token) throw new Error("رمز النشر غير متاح. أعد ربط حساب Meta.")

  return { connection: connection as MetaConnection, pageAccessToken: secret.page_access_token as string }
}
