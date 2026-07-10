-- Broker role helper for HELM Portal
-- This file supports the application-level broker permissions added in the frontend.
-- A broker may also be a client at the same time; do not delete the matching row from public.clients.

create extension if not exists pgcrypto;

alter table public.brokers add column if not exists email text;
create index if not exists idx_brokers_email_lower on public.brokers (lower(email));
create index if not exists idx_user_profiles_role on public.user_profiles (role);

-- Usage example:
-- select public.assign_broker_role('broker@example.com', 'اسم البروكر', '0500000000', 10);

create or replace function public.assign_broker_role(
  p_email text,
  p_full_name text,
  p_phone text default null,
  p_default_commission_percent numeric default 0
)
returns table(profile_id uuid, broker_id uuid, email text, full_name text, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_profile_id uuid;
  v_broker_id uuid;
begin
  if v_email is null or v_email = '' then
    raise exception 'email is required';
  end if;
  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'full_name is required';
  end if;

  insert into public.user_profiles (email, full_name, role, updated_date)
  values (v_email, trim(p_full_name), 'broker', timezone('utc', now()))
  on conflict (email) do update set
    full_name = coalesce(nullif(trim(excluded.full_name), ''), public.user_profiles.full_name),
    role = 'broker',
    updated_date = timezone('utc', now())
  returning id into v_profile_id;

  insert into public.brokers (email, full_name, phone, default_commission_percent, status, updated_date)
  values (v_email, trim(p_full_name), p_phone, coalesce(p_default_commission_percent, 0), 'نشط', timezone('utc', now()))
  on conflict (id) do update set id = excluded.id
  returning id into v_broker_id;

  -- If there is already a broker with the same email, update it instead of creating duplicates.
  if v_broker_id is null then
    select id into v_broker_id from public.brokers where lower(email) = v_email limit 1;
  end if;

  if v_broker_id is null then
    select id into v_broker_id from public.brokers where full_name = trim(p_full_name) limit 1;
  end if;

  if v_broker_id is not null then
    update public.brokers
       set email = v_email,
           full_name = trim(p_full_name),
           phone = coalesce(p_phone, phone),
           default_commission_percent = coalesce(p_default_commission_percent, default_commission_percent, 0),
           status = coalesce(status, 'نشط'),
           updated_date = timezone('utc', now())
     where id = v_broker_id;
  end if;

  return query
  select v_profile_id, v_broker_id, v_email, trim(p_full_name), 'broker'::text;
end;
$$;

comment on function public.assign_broker_role(text, text, text, numeric) is 'Creates/updates user_profiles role broker and links a broker record by email. Broker can also remain a client.';
