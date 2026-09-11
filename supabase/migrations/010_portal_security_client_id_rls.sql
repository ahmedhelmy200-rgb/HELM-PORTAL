-- HELM Portal Security Hardening - Phase 1
-- Purpose:
-- 1) Keep legacy client_name compatibility.
-- 2) Add stable auth/user/client linkage where missing.
-- 3) Prepare RLS policies for staff and client access.
-- 4) Prepare private uploads bucket policies.
-- Run once in Supabase SQL Editor after reviewing table names.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Add stable columns. These are nullable to avoid breaking old data.
-- -----------------------------------------------------------------------------
alter table if exists public.user_profiles add column if not exists user_id uuid;
alter table if exists public.user_profiles add column if not exists email text;
alter table if exists public.user_profiles add column if not exists role text default 'client';

alter table if exists public.clients add column if not exists user_id uuid;
alter table if exists public.clients add column if not exists email text;
alter table if exists public.clients add column if not exists created_date timestamptz default now();
alter table if exists public.clients add column if not exists updated_date timestamptz default now();

alter table if exists public.cases add column if not exists client_id uuid;
alter table if exists public.invoices add column if not exists client_id uuid;
alter table if exists public.documents add column if not exists client_id uuid;
alter table if exists public.sessions add column if not exists client_id uuid;
alter table if exists public.tasks add column if not exists client_id uuid;
alter table if exists public.notifications add column if not exists user_id uuid;
alter table if exists public.notifications add column if not exists user_email text;

-- ملاحظة ترتيب: يجب أن تسبق إضافة الأعمدة تعريف الدوال أدناه.
-- دوال language sql تُتحقَّق من أعمدتها وقت الإنشاء (check_function_bodies)،
-- وكان helm_my_client_id() يشير إلى clients.user_id قبل إضافته فيفشل الملف بالكامل:
--   ERROR: column c.user_id does not exist (SQLSTATE 42703)

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.helm_current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.helm_is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    where (
      up.user_id = auth.uid()
      or lower(coalesce(up.email, '')) = public.helm_current_email()
    )
    and lower(coalesce(up.role, '')) in ('admin','staff','lawyer','assistant','secretary')
  );
$$;

create or replace function public.helm_my_client_id()
returns uuid
language sql
stable
as $$
  select c.id
  from public.clients c
  where (
    c.user_id = auth.uid()
    or lower(coalesce(c.email, '')) = public.helm_current_email()
  )
  order by c.created_date nulls last
  limit 1;
$$;

-- المفاتيح الأجنبية تُضاف بحذر: لا نفرض قيدًا إلا إذا كان نوع العمود مطابقًا
-- لنوع clients.id (uuid). بعض القواعد القديمة أنشأت cases.client_id من نوع text،
-- ومحاولة إضافة القيد عليها تفشل وتُسقط الملف بالكامل:
--   ERROR: foreign key constraint "cases_client_id_fkey" cannot be implemented
--   Key columns "client_id" and "id" are of incompatible types: text and uuid.
do $fk$
declare
  r record;
  col_type text;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'clients'
  ) then
    return;
  end if;

  for r in
    select * from (values
      ('cases',     'cases_client_id_fkey'),
      ('invoices',  'invoices_client_id_fkey'),
      ('documents', 'documents_client_id_fkey'),
      ('sessions',  'sessions_client_id_fkey'),
      ('tasks',     'tasks_client_id_fkey')
    ) as t(tbl, cname)
  loop
    select c.data_type into col_type
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = r.tbl
       and c.column_name = 'client_id';

    if col_type is null then
      continue;
    end if;

    if col_type <> 'uuid' then
      raise notice 'تم تجاوز قيد %.% لأن النوع % لا يطابق clients.id (uuid).',
        r.tbl, r.cname, col_type;
      continue;
    end if;

    begin
      execute format(
        'alter table public.%I add constraint %I foreign key (client_id) references public.clients(id) on delete set null not valid',
        r.tbl, r.cname
      );
    exception
      when duplicate_object then null;
      when duplicate_table  then null;
    end;
  end loop;
end $fk$;

-- -----------------------------------------------------------------------------
-- تعبئة رجعية لـ client_id من client_name القديم، مع مراعاة نوع العمود:
-- uuid يُسند مباشرة، و text يُسند بعد تحويل صريح.
do $bf$
declare
  r record;
  col_type text;
begin
  for r in
    select * from (values ('cases'), ('invoices'), ('documents'), ('sessions'), ('tasks')) as t(tbl)
  loop
    select c.data_type into col_type
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name = r.tbl
       and c.column_name = 'client_id';

    if col_type is null then
      continue;
    end if;

    if col_type = 'uuid' then
      execute format($sql$
        update public.%I t
           set client_id = c.id
          from public.clients c
         where t.client_id is null
           and lower(trim(coalesce(t.client_name, ''))) = lower(trim(coalesce(c.full_name, '')))
      $sql$, r.tbl);
    else
      execute format($sql$
        update public.%I t
           set client_id = c.id::text
          from public.clients c
         where t.client_id is null
           and lower(trim(coalesce(t.client_name, ''))) = lower(trim(coalesce(c.full_name, '')))
      $sql$, r.tbl);
    end if;
  end loop;
end $bf$;

-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
create index if not exists idx_user_profiles_email on public.user_profiles(lower(email));
create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_clients_email on public.clients(lower(email));
create index if not exists idx_cases_client_id on public.cases(client_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_documents_client_id on public.documents(client_id);
create index if not exists idx_sessions_client_id on public.sessions(client_id);
create index if not exists idx_tasks_client_id on public.tasks(client_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_email on public.notifications(lower(user_email));

-- -----------------------------------------------------------------------------
-- RLS Policies
-- -----------------------------------------------------------------------------
alter table if exists public.user_profiles enable row level security;
alter table if exists public.clients enable row level security;
alter table if exists public.cases enable row level security;
alter table if exists public.invoices enable row level security;
alter table if exists public.documents enable row level security;
alter table if exists public.sessions enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.office_settings enable row level security;
alter table if exists public.legal_templates enable row level security;
alter table if exists public.expenses enable row level security;
alter table if exists public.future_debts enable row level security;

-- Drop old phase policies only. Existing custom policies with other names remain untouched.
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
    and policyname like 'helm_phase1_%'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- user_profiles
create policy helm_phase1_profiles_select on public.user_profiles
for select to authenticated
using (public.helm_is_staff() or user_id = auth.uid() or lower(coalesce(email,'')) = public.helm_current_email());

create policy helm_phase1_profiles_staff_write on public.user_profiles
for all to authenticated
using (public.helm_is_staff())
with check (public.helm_is_staff());

-- clients
create policy helm_phase1_clients_select on public.clients
for select to authenticated
using (public.helm_is_staff() or user_id = auth.uid() or lower(coalesce(email,'')) = public.helm_current_email());

create policy helm_phase1_clients_staff_write on public.clients
for all to authenticated
using (public.helm_is_staff())
with check (public.helm_is_staff());

create policy helm_phase1_clients_self_insert on public.clients
for insert to authenticated
with check (lower(coalesce(email,'')) = public.helm_current_email() or user_id = auth.uid());

create policy helm_phase1_clients_self_update on public.clients
for update to authenticated
using (user_id = auth.uid() or lower(coalesce(email,'')) = public.helm_current_email())
with check (user_id = auth.uid() or lower(coalesce(email,'')) = public.helm_current_email());

-- client-owned tables
create policy helm_phase1_cases_select on public.cases
for select to authenticated
using (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text);

create policy helm_phase1_invoices_select on public.invoices
for select to authenticated
using (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text);

create policy helm_phase1_documents_select on public.documents
for select to authenticated
using (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text or lower(coalesce(created_by,'')) = public.helm_current_email());

create policy helm_phase1_sessions_select on public.sessions
for select to authenticated
using (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text);

create policy helm_phase1_tasks_select on public.tasks
for select to authenticated
using (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text or lower(coalesce(created_by,'')) = public.helm_current_email());

create policy helm_phase1_documents_client_insert on public.documents
for insert to authenticated
with check (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text or lower(coalesce(created_by,'')) = public.helm_current_email());

create policy helm_phase1_documents_client_update on public.documents
for update to authenticated
using (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text or lower(coalesce(created_by,'')) = public.helm_current_email())
with check (public.helm_is_staff() or client_id::text = public.helm_my_client_id()::text or lower(coalesce(created_by,'')) = public.helm_current_email());

create policy helm_phase1_staff_all_cases on public.cases for all to authenticated using (public.helm_is_staff()) with check (public.helm_is_staff());
create policy helm_phase1_staff_all_invoices on public.invoices for all to authenticated using (public.helm_is_staff()) with check (public.helm_is_staff());
create policy helm_phase1_staff_all_documents on public.documents for all to authenticated using (public.helm_is_staff()) with check (public.helm_is_staff());
create policy helm_phase1_staff_all_sessions on public.sessions for all to authenticated using (public.helm_is_staff()) with check (public.helm_is_staff());
create policy helm_phase1_staff_all_tasks on public.tasks for all to authenticated using (public.helm_is_staff()) with check (public.helm_is_staff());

-- notifications
create policy helm_phase1_notifications_select on public.notifications
for select to authenticated
using (public.helm_is_staff() or user_id = auth.uid() or lower(coalesce(user_email,'')) = public.helm_current_email());

create policy helm_phase1_notifications_write on public.notifications
for all to authenticated
using (public.helm_is_staff() or user_id = auth.uid() or lower(coalesce(user_email,'')) = public.helm_current_email())
with check (public.helm_is_staff() or user_id = auth.uid() or lower(coalesce(user_email,'')) = public.helm_current_email());

-- office settings and admin-only tables
create policy helm_phase1_office_settings_read on public.office_settings
for select to authenticated
using (true);

create policy helm_phase1_office_settings_staff_write on public.office_settings
for all to authenticated
using (public.helm_is_staff())
with check (public.helm_is_staff());

create policy helm_phase1_templates_staff_all on public.legal_templates
for all to authenticated
using (public.helm_is_staff())
with check (public.helm_is_staff());

create policy helm_phase1_expenses_staff_all on public.expenses
for all to authenticated
using (public.helm_is_staff())
with check (public.helm_is_staff());

create policy helm_phase1_future_debts_staff_all on public.future_debts
for all to authenticated
using (public.helm_is_staff())
with check (public.helm_is_staff());

-- -----------------------------------------------------------------------------
-- Storage bucket and policies
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,
  15728640,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage'
    and tablename = 'objects'
    and policyname like 'helm_phase1_%'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy helm_phase1_uploads_read on storage.objects
for select to authenticated
using (bucket_id = 'uploads');

create policy helm_phase1_uploads_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'uploads');

create policy helm_phase1_uploads_update on storage.objects
for update to authenticated
using (bucket_id = 'uploads')
with check (bucket_id = 'uploads');

create policy helm_phase1_uploads_delete_staff on storage.objects
for delete to authenticated
using (bucket_id = 'uploads' and public.helm_is_staff());

commit;
