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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const { token } = await req.json()
    const paymentToken = String(token || "").trim()
    if (paymentToken.length < 20) return json({ error: "رابط الدفع غير صالح أو منتهي." }, 400)

    const supabase = serviceClient()
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id,invoice_number,client_name,case_title,case_number,issue_date,due_date,total_fees,paid_amount,discount,vat_rate,status,items,notes,payment_method,office_name,office_phone,office_address,payment_token,portal_scope,business_unit")
      .eq("payment_token", paymentToken)
      .maybeSingle()

    if (invoiceError) throw invoiceError
    if (!invoice) return json({ error: "رابط الدفع غير صالح أو منتهي." }, 404)

    const { data: office, error: officeError } = await supabase
      .from("office_settings")
      .select("office_name,office_name_en,lawyer_name,phone,email,address,logo_url,bank_name,bank_account,iban,currency,stripe_publishable_key")
      .order("created_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (officeError) throw officeError
    return json({ invoice, office: office || null })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "تعذر تحميل الفاتورة." }, 500)
  }
})
