import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Supabase service credentials are not configured.")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => part.trim().split("="))
  const timestamp = parts.find(([key]) => key === "t")?.[1]
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value)
  if (!timestamp || !signatures.length) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`))
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return signatures.some((candidate) => constantTimeEqual(candidate.toLowerCase(), expected))
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")
    if (!webhookSecret) return json({ error: "Stripe webhook secret is not configured." }, 503)

    const signatureHeader = req.headers.get("stripe-signature") || ""
    const payload = await req.text()
    const valid = await verifyStripeSignature(payload, signatureHeader, webhookSecret)
    if (!valid) return json({ error: "Invalid Stripe signature." }, 400)

    const event = JSON.parse(payload)
    if (event?.type !== "payment_intent.succeeded") {
      return json({ received: true, ignored: true })
    }

    const intent = event.data?.object
    const invoiceId = String(intent?.metadata?.invoice_id || "")
    const amount = Number(intent?.amount_received || intent?.amount || 0) / 100

    if (!invoiceId || !intent?.id || !Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Stripe event is missing invoice metadata or amount." }, 400)
    }

    const supabase = serviceClient()
    const { data, error } = await supabase.rpc("apply_stripe_payment", {
      p_intent_id: intent.id,
      p_invoice_id: invoiceId,
      p_amount: amount,
    })
    if (error) throw error

    return json({ received: true, result: data })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, 500)
  }
})
