-- Contacts and brokers module for HELM Portal
-- Run this migration in Supabase SQL Editor before using Contacts/Brokers in production.

create extension if not exists pgcrypto;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  full_name text not null,
  phone text,
  email text,
  company text,
  category text default 'عام',
  source text,
  status text default 'نشط',
  notes text
);

create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  full_name text not null,
  phone text,
  email text,
  default_commission_percent numeric default 0,
  status text default 'نشط',
  notes text
);

alter table public.clients add column if not exists broker_id text;
alter table public.clients add column if not exists broker_name text;
alter table public.clients add column if not exists broker_commission_percent numeric default 0;

alter table public.cases add column if not exists broker_id text;
alter table public.cases add column if not exists broker_name text;
alter table public.cases add column if not exists broker_commission_percent numeric default 0;
alter table public.cases add column if not exists broker_commission_amount numeric default 0;

create or replace function public.set_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_contacts_updated_date on public.contacts;
create trigger trg_contacts_updated_date before update on public.contacts for each row execute function public.set_updated_date();

drop trigger if exists trg_brokers_updated_date on public.brokers;
create trigger trg_brokers_updated_date before update on public.brokers for each row execute function public.set_updated_date();

alter table public.contacts enable row level security;
alter table public.brokers enable row level security;

drop policy if exists "authenticated select contacts" on public.contacts;
create policy "authenticated select contacts" on public.contacts for select to authenticated using (true);
drop policy if exists "authenticated insert contacts" on public.contacts;
create policy "authenticated insert contacts" on public.contacts for insert to authenticated with check (true);
drop policy if exists "authenticated update contacts" on public.contacts;
create policy "authenticated update contacts" on public.contacts for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete contacts" on public.contacts;
create policy "authenticated delete contacts" on public.contacts for delete to authenticated using (true);

drop policy if exists "authenticated select brokers" on public.brokers;
create policy "authenticated select brokers" on public.brokers for select to authenticated using (true);
drop policy if exists "authenticated insert brokers" on public.brokers;
create policy "authenticated insert brokers" on public.brokers for insert to authenticated with check (true);
drop policy if exists "authenticated update brokers" on public.brokers;
create policy "authenticated update brokers" on public.brokers for update to authenticated using (true) with check (true);
drop policy if exists "authenticated delete brokers" on public.brokers;
create policy "authenticated delete brokers" on public.brokers for delete to authenticated using (true);

create index if not exists idx_contacts_full_name on public.contacts (full_name);
create index if not exists idx_contacts_phone on public.contacts (phone);
create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_brokers_full_name on public.brokers (full_name);
create index if not exists idx_clients_broker_name on public.clients (broker_name);
create index if not exists idx_cases_broker_name on public.cases (broker_name);
