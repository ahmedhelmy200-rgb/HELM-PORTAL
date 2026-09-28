-- HELM bilingual client identity + shared case relationships

alter table public.clients
  add column if not exists name_ar text,
  add column if not exists name_en text,
  add column if not exists name_aliases text[] not null default '{}'::text[];

update public.clients
set
  name_ar = case
    when full_name ~ '[ء-ي]' and coalesce(name_ar, '') = '' then btrim(full_name)
    else name_ar
  end,
  name_en = case
    when full_name ~ '[A-Za-z]' and coalesce(name_en, '') = '' then btrim(full_name)
    else name_en
  end
where
  (full_name ~ '[ء-ي]' and coalesce(name_ar, '') = '')
  or (full_name ~ '[A-Za-z]' and coalesce(name_en, '') = '');

create table if not exists public.case_clients (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  relation_role text not null default 'موكل',
  is_primary boolean not null default false,
  created_by text,
  created_date timestamptz not null default now(),
  unique (case_id, client_id)
);

create index if not exists idx_case_clients_case_id on public.case_clients(case_id);
create index if not exists idx_case_clients_client_id on public.case_clients(client_id);

alter table public.case_clients enable row level security;

drop policy if exists case_clients_select on public.case_clients;
create policy case_clients_select
on public.case_clients for select
to authenticated
using (
  (select public.app_is_staff())
  or client_id::text = (select public.current_client_id())
);

drop policy if exists case_clients_insert_staff on public.case_clients;
create policy case_clients_insert_staff
on public.case_clients for insert
to authenticated
with check ((select public.app_is_staff()));

drop policy if exists case_clients_update_staff on public.case_clients;
create policy case_clients_update_staff
on public.case_clients for update
to authenticated
using ((select public.app_is_staff()))
with check ((select public.app_is_staff()));

drop policy if exists case_clients_delete_staff on public.case_clients;
create policy case_clients_delete_staff
on public.case_clients for delete
to authenticated
using ((select public.app_is_staff()));

insert into public.case_clients (case_id, client_id, relation_role, is_primary, created_by)
select ca.id, cl.id, 'موكل', true, 'system-backfill'
from public.cases ca
join public.clients cl on cl.id::text = ca.client_id
on conflict (case_id, client_id) do nothing;

drop policy if exists case_clients_shared_case_select on public.cases;
create policy case_clients_shared_case_select
on public.cases for select
to authenticated
using (
  (select public.app_is_staff())
  or exists (
    select 1
    from public.case_clients cc
    where cc.case_id = cases.id
      and cc.client_id::text = (select public.current_client_id())
  )
);
