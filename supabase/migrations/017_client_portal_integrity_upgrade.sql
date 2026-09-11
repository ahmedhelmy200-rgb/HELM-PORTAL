-- HELM Portal: client dashboard, case results, stable linking, and duplicate protection
-- Run after migrations 010, 022, and 024.
-- This migration never deletes or merges existing rows automatically.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Case outcome fields used by the client success indicator.
-- -----------------------------------------------------------------------------
alter table if exists public.cases add column if not exists case_result text default 'غير محسومة';
alter table if exists public.cases add column if not exists success_percentage numeric;
alter table if exists public.cases add column if not exists result_notes text;

alter table if exists public.cases drop constraint if exists cases_success_percentage_range;
alter table if exists public.cases
  add constraint cases_success_percentage_range
  check (success_percentage is null or (success_percentage >= 0 and success_percentage <= 100)) not valid;

create index if not exists idx_cases_case_result on public.cases(case_result);
create index if not exists idx_cases_success_percentage on public.cases(success_percentage);

-- -----------------------------------------------------------------------------
-- Normalization helpers used only for matching and duplicate auditing.
-- -----------------------------------------------------------------------------
create or replace function public.helm_norm_text(value text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(lower(coalesce(value, '')), '[^[:alnum:]ء-ي]+', ' ', 'g'));
$$;

create or replace function public.helm_norm_email(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace function public.helm_norm_phone(value text)
returns text
language plpgsql
immutable
as $$
declare
  digits text := regexp_replace(coalesce(value, ''), '[^0-9]+', '', 'g');
begin
  if digits like '00971%' then return substring(digits from 3); end if;
  if digits like '971%' then return digits; end if;
  if digits like '0%' and length(digits) >= 9 then return '971' || substring(digits from 2); end if;
  return digits;
end;
$$;

create or replace function public.helm_norm_identity(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(value, ''), '[^[:alnum:]ء-ي]+', '', 'g'));
$$;

-- -----------------------------------------------------------------------------
-- Stable client_id linking. Only unambiguous normalized-name matches are used.
-- -----------------------------------------------------------------------------
with unique_clients as (
  select min(id) as id, public.helm_norm_text(full_name) as normalized_name
  from public.clients
  where public.helm_norm_text(full_name) <> ''
  group by public.helm_norm_text(full_name)
  having count(*) = 1
)
update public.cases target
set client_id = source.id
from unique_clients source
where target.client_id is null
  and public.helm_norm_text(target.client_name) = source.normalized_name;

with unique_clients as (
  select min(id) as id, public.helm_norm_text(full_name) as normalized_name
  from public.clients
  where public.helm_norm_text(full_name) <> ''
  group by public.helm_norm_text(full_name)
  having count(*) = 1
)
update public.invoices target
set client_id = source.id
from unique_clients source
where target.client_id is null
  and public.helm_norm_text(target.client_name) = source.normalized_name;

with unique_clients as (
  select min(id) as id, public.helm_norm_text(full_name) as normalized_name
  from public.clients
  where public.helm_norm_text(full_name) <> ''
  group by public.helm_norm_text(full_name)
  having count(*) = 1
)
update public.documents target
set client_id = source.id
from unique_clients source
where target.client_id is null
  and public.helm_norm_text(target.client_name) = source.normalized_name;

with unique_clients as (
  select min(id) as id, public.helm_norm_text(full_name) as normalized_name
  from public.clients
  where public.helm_norm_text(full_name) <> ''
  group by public.helm_norm_text(full_name)
  having count(*) = 1
)
update public.sessions target
set client_id = source.id
from unique_clients source
where target.client_id is null
  and public.helm_norm_text(target.client_name) = source.normalized_name;

create index if not exists idx_clients_norm_email on public.clients(public.helm_norm_email(email));
create index if not exists idx_clients_norm_phone on public.clients(public.helm_norm_phone(phone));
create index if not exists idx_clients_norm_identity on public.clients(public.helm_norm_identity(id_number));
create index if not exists idx_invoices_norm_number on public.invoices(public.helm_norm_text(invoice_number));

-- -----------------------------------------------------------------------------
-- Audit views. These expose duplicates for review but do not delete anything.
-- -----------------------------------------------------------------------------
create or replace view public.helm_duplicate_clients as
with keys as (
  select id, full_name, 'رقم الهوية'::text as match_type, public.helm_norm_identity(id_number) as match_value
  from public.clients where public.helm_norm_identity(id_number) <> ''
  union all
  select id, full_name, 'البريد الإلكتروني', public.helm_norm_email(email)
  from public.clients where public.helm_norm_email(email) <> ''
  union all
  select id, full_name, 'رقم الهاتف', public.helm_norm_phone(phone)
  from public.clients where public.helm_norm_phone(phone) <> ''
)
select match_type, match_value, count(*) as duplicate_count,
       array_agg(id order by id) as client_ids,
       array_agg(full_name order by full_name) as client_names
from keys
group by match_type, match_value
having count(*) > 1;

create or replace view public.helm_duplicate_invoices as
with invoice_keys as (
  select id, invoice_number, client_name, case_title, issue_date, total_fees,
         coalesce(portal_scope, business_unit, 'helm') as scope,
         public.helm_norm_text(invoice_number) as normalized_number,
         public.helm_norm_text(client_name) as normalized_client,
         coalesce(case_id::text, public.helm_norm_text(case_title)) as normalized_case
  from public.invoices
)
select scope, normalized_number, normalized_client, normalized_case, issue_date, total_fees,
       count(*) as duplicate_count,
       array_agg(id order by id) as invoice_ids,
       array_agg(invoice_number order by invoice_number) as invoice_numbers
from invoice_keys
group by scope, normalized_number, normalized_client, normalized_case, issue_date, total_fees
having count(*) > 1
   and (normalized_number <> '' or (normalized_client <> '' and normalized_case <> ''));

-- -----------------------------------------------------------------------------
-- Future duplicate protection. Existing duplicate rows remain available to clean.
-- -----------------------------------------------------------------------------
create or replace function public.helm_block_duplicate_client()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and public.helm_norm_email(new.email) = public.helm_norm_email(old.email)
     and public.helm_norm_phone(new.phone) = public.helm_norm_phone(old.phone)
     and public.helm_norm_identity(new.id_number) = public.helm_norm_identity(old.id_number)
  then
    return new;
  end if;

  if exists (
    select 1 from public.clients existing
    where existing.id <> coalesce(new.id, gen_random_uuid())
      and (
        (public.helm_norm_identity(new.id_number) <> '' and public.helm_norm_identity(existing.id_number) = public.helm_norm_identity(new.id_number))
        or (public.helm_norm_email(new.email) <> '' and public.helm_norm_email(existing.email) = public.helm_norm_email(new.email))
        or (public.helm_norm_phone(new.phone) <> '' and public.helm_norm_phone(existing.phone) = public.helm_norm_phone(new.phone))
      )
  ) then
    raise exception 'DUPLICATE_CLIENT: يوجد موكل مسجل بنفس الهوية أو البريد أو الهاتف';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_helm_block_duplicate_client on public.clients;
create trigger trg_helm_block_duplicate_client
before insert or update on public.clients
for each row execute function public.helm_block_duplicate_client();

create or replace function public.helm_block_duplicate_invoice()
returns trigger
language plpgsql
as $$
declare
  new_scope text := coalesce(new.portal_scope, new.business_unit, 'helm');
begin
  if tg_op = 'UPDATE'
     and public.helm_norm_text(new.invoice_number) = public.helm_norm_text(old.invoice_number)
     and public.helm_norm_text(new.client_name) = public.helm_norm_text(old.client_name)
     and coalesce(new.case_id::text, public.helm_norm_text(new.case_title)) = coalesce(old.case_id::text, public.helm_norm_text(old.case_title))
     and new.issue_date is not distinct from old.issue_date
     and new.total_fees is not distinct from old.total_fees
     and new_scope = coalesce(old.portal_scope, old.business_unit, 'helm')
  then
    return new;
  end if;

  if exists (
    select 1 from public.invoices existing
    where existing.id <> coalesce(new.id, gen_random_uuid())
      and coalesce(existing.portal_scope, existing.business_unit, 'helm') = new_scope
      and (
        (public.helm_norm_text(new.invoice_number) <> '' and public.helm_norm_text(existing.invoice_number) = public.helm_norm_text(new.invoice_number))
        or (
          public.helm_norm_text(existing.client_name) = public.helm_norm_text(new.client_name)
          and coalesce(existing.case_id::text, public.helm_norm_text(existing.case_title)) = coalesce(new.case_id::text, public.helm_norm_text(new.case_title))
          and existing.issue_date is not distinct from new.issue_date
          and existing.total_fees is not distinct from new.total_fees
        )
      )
  ) then
    raise exception 'DUPLICATE_INVOICE: توجد فاتورة مطابقة في نفس القسم';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_helm_block_duplicate_invoice on public.invoices;
create trigger trg_helm_block_duplicate_invoice
before insert or update on public.invoices
for each row execute function public.helm_block_duplicate_invoice();

commit;

-- Review after running:
-- select * from public.helm_duplicate_clients;
-- select * from public.helm_duplicate_invoices;
