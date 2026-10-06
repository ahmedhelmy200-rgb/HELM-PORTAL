-- Secure public payment links and idempotent Stripe payment application.

alter table public.invoices
  add column if not exists payment_token text;

update public.invoices
set payment_token = gen_random_uuid()::text
where payment_token is null or btrim(payment_token) = '';

alter table public.invoices
  alter column payment_token set default gen_random_uuid()::text;

alter table public.invoices
  alter column payment_token set not null;

create unique index if not exists invoices_payment_token_uidx
  on public.invoices(payment_token);

create or replace function public.apply_stripe_payment(
  p_intent_id text,
  p_invoice_id uuid,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_inserted integer := 0;
  v_total numeric := 0;
  v_new_paid numeric := 0;
  v_transaction_id text := 'stripe:' || coalesce(p_intent_id, '');
begin
  if coalesce(btrim(p_intent_id), '') = '' then
    raise exception 'Stripe PaymentIntent id is required';
  end if;

  if p_invoice_id is null then
    raise exception 'Invoice id is required';
  end if;

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  insert into public.income_transactions (
    id, title, amount, category, income_date, source, notes, status, bank_reference, created_by
  )
  values (
    v_transaction_id,
    'سداد فاتورة ' || coalesce(v_invoice.invoice_number, v_invoice.id::text),
    p_amount,
    'أتعاب قانونية',
    current_date,
    'Stripe',
    'Stripe PaymentIntent ' || p_intent_id || ' — ' || coalesce(v_invoice.client_name, ''),
    'محصل',
    p_intent_id,
    'stripe-webhook'
  )
  on conflict (id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return jsonb_build_object(
      'applied', false,
      'duplicate', true,
      'invoice_id', v_invoice.id,
      'paid_amount', coalesce(v_invoice.paid_amount, 0),
      'status', v_invoice.status
    );
  end if;

  v_total := greatest(
    0,
    (coalesce(v_invoice.total_fees, 0) - coalesce(v_invoice.discount, 0))
    * (1 + coalesce(v_invoice.vat_rate, 0) / 100.0)
  );

  v_new_paid := least(v_total, coalesce(v_invoice.paid_amount, 0) + p_amount);

  update public.invoices
  set
    paid_amount = v_new_paid,
    status = case
      when v_total <= 0 or v_new_paid >= v_total - 0.005 then 'مدفوعة'
      when v_new_paid > 0 then 'مدفوعة جزئياً'
      else status
    end,
    payment_method = 'بطاقة ائتمان',
    updated_date = now()
  where id = v_invoice.id;

  return jsonb_build_object(
    'applied', true,
    'duplicate', false,
    'invoice_id', v_invoice.id,
    'paid_amount', v_new_paid,
    'total', v_total,
    'status', case
      when v_total <= 0 or v_new_paid >= v_total - 0.005 then 'مدفوعة'
      when v_new_paid > 0 then 'مدفوعة جزئياً'
      else v_invoice.status
    end
  );
end;
$$;

revoke all on function public.apply_stripe_payment(text, uuid, numeric) from public;
grant execute on function public.apply_stripe_payment(text, uuid, numeric) to service_role;
