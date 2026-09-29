import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  })
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Supabase service credentials are not configured.")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function toAmount(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const { payment_token } = await req.json()
    const paymentToken = String(payment_token || "").trim()
    if (paymentToken.length < 20) return json({ error: "رابط الدفع غير صالح." }, 400)

    const supabase = serviceClient()
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id,invoice_number,client_name,total_fees,paid_amount,discount,vat_rate,status,payment_token")
      .eq("payment_token", paymentToken)
      .maybeSingle()

    if (invoiceError) throw invoiceError
    if (!invoice) return json({ error: "رابط الدفع غير صالح أو منتهي." }, 404)

    const subtotal = Math.max(0, toAmount(invoice.total_fees) - toAmount(invoice.discount))
    const total = subtotal * (1 + toAmount(invoice.vat_rate) / 100)
    const remaining = Math.max(0, total - toAmount(invoice.paid_amount))

    if (invoice.status === "مدفوعة" || remaining <= 0.005) {
      return json({ error: "هذه الفاتورة مسددة بالفعل." }, 409)
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeKey) return json({ error: "لم يتم تكوين مفتاح Stripe." }, 503)

    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(remaining * 100)),
        currency: "aed",
        "automatic_payment_methods[enabled]": "true",
        description: `فاتورة ${invoice.invoice_number || invoice.id}`,
        "metadata[invoice_id]": invoice.id,
        "metadata[invoice_number]": invoice.invoice_number || "",
      }),
    })

    const intent = await stripeRes.json()
    if (!stripeRes.ok || intent?.error) {
      return json({ error: intent?.error?.message || "تعذر تجهيز الدفع." }, 400)
    }

    return json({
      client_secret: intent.client_secret,
      id: intent.id,
      amount: remaining,
      currency: "aed",
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "تعذر تجهيز الدفع." }, 500)
  }
})
