-- HELM Unified: Portal + Smart on one Auth/RLS/Storage/Data model
-- نفذ هذا الملف بعد 001-008 إذا كانت قاعدة Supabase موجودة بالفعل.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- 1) Schema compatibility columns used by both Portal and Smart
-- -------------------------------------------------------------------

alter table public.clients add column if not exists avatar_url text;
alter table public.clients add column if not exists documents jsonb default '[]'::jsonb;
alter table public.clients add column if not exists balance numeric default 0;

alter table public.cases add column if not exists sub_category text;
alter table public.cases add column if not exists is_archived boolean default false;
alter table public.cases add column if not exists documents jsonb default '[]'::jsonb;
alter table public.cases add column if not exists comments jsonb default '[]'::jsonb;
alter table public.cases add column if not exists activities jsonb default '[]'::jsonb;

alter table public.invoices add column if not exists client_id text;
alter table public.invoices add column if not exists branch text;

alter table public.expenses add column if not exists branch text;

alter table public.documents add column if not exists client_id text;

create table if not exists public.future_debts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text,
  client_id text,
  client_name text not null,
  amount numeric not null default 0,
  due_date date,
  description text,
  is_reminded boolean default false,
  status text default 'مستحق'
);

-- -------------------------------------------------------------------
-- 2) Unified role helpers
-- -------------------------------------------------------------------

create or replace function public.is_staff_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where lower(up.email) = lower(target_email)
      and up.role in ('admin','staff','lawyer','assistant','secretary')
  );
$$;

create or replace function public.current_client_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.id::text
  from public.clients c
  where lower(c.email) = lower(auth.email())
  order by c.created_date asc
  limit 1;
$$;

create or replace function public.current_client_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.full_name
  from public.clients c
  where lower(c.email) = lower(auth.email())
  order by c.created_date asc
  limit 1;
$$;

revoke all on function public.is_staff_email(text) from public;
revoke all on function public.current_client_id() from public;
revoke all on function public.current_client_name() from public;
grant execute on function public.is_staff_email(text) to authenticated;
grant execute on function public.current_client_id() to authenticated;
grant execute on function public.current_client_name() to authenticated;

-- -------------------------------------------------------------------
-- 3) RLS: clients / cases / invoices / documents / expenses / debts
-- -------------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.invoices enable row level security;
alter table public.documents enable row level security;
alter table public.expenses enable row level security;
alter table public.future_debts enable row level security;

-- remove broad or old policies on key tables

drop policy if exists "authenticated select clients" on public.clients;
drop policy if exists "authenticated insert clients" on public.clients;
drop policy if exists "authenticated update clients" on public.clients;
drop policy if exists "authenticated delete clients" on public.clients;
drop policy if exists "clients scoped select clients" on public.clients;
drop policy if exists "staff insert clients" on public.clients;
drop policy if exists "staff update clients" on public.clients;
drop policy if exists "staff delete clients" on public.clients;
drop policy if exists "self register client row" on public.clients;
drop policy if exists "self insert clients" on public.clients;
drop policy if exists "self update own client row" on public.clients;
drop policy if exists "unified clients select" on public.clients;
drop policy if exists "unified clients insert" on public.clients;
drop policy if exists "unified clients update" on public.clients;
drop policy if exists "unified clients delete" on public.clients;

create policy "unified clients select" on public.clients
for select to authenticated
using (public.is_staff_email(auth.email()) or lower(email) = lower(auth.email()));

create policy "unified clients insert" on public.clients
for insert to authenticated
with check (public.is_staff_email(auth.email()) or lower(email) = lower(auth.email()));

create policy "unified clients update" on public.clients
for update to authenticated
using (public.is_staff_email(auth.email()) or lower(email) = lower(auth.email()))
with check (public.is_staff_email(auth.email()) or lower(email) = lower(auth.email()));

create policy "unified clients delete" on public.clients
for delete to authenticated
using (public.is_staff_email(auth.email()));

-- cases

drop policy if exists "authenticated select cases" on public.cases;
drop policy if exists "authenticated insert cases" on public.cases;
drop policy if exists "authenticated update cases" on public.cases;
drop policy if exists "authenticated delete cases" on public.cases;
drop policy if exists "scoped select cases" on public.cases;
drop policy if exists "staff insert cases" on public.cases;
drop policy if exists "staff update cases" on public.cases;
drop policy if exists "staff delete cases" on public.cases;
drop policy if exists "unified cases select" on public.cases;
drop policy if exists "unified cases insert" on public.cases;
drop policy if exists "unified cases update" on public.cases;
drop policy if exists "unified cases delete" on public.cases;

create policy "unified cases select" on public.cases
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
);

create policy "unified cases insert" on public.cases
for insert to authenticated
with check (public.is_staff_email(auth.email()));

create policy "unified cases update" on public.cases
for update to authenticated
using (public.is_staff_email(auth.email()))
with check (public.is_staff_email(auth.email()));

create policy "unified cases delete" on public.cases
for delete to authenticated
using (public.is_staff_email(auth.email()));

-- invoices

drop policy if exists "authenticated select invoices" on public.invoices;
drop policy if exists "authenticated insert invoices" on public.invoices;
drop policy if exists "authenticated update invoices" on public.invoices;
drop policy if exists "authenticated delete invoices" on public.invoices;
drop policy if exists "scoped select invoices" on public.invoices;
drop policy if exists "staff insert invoices" on public.invoices;
drop policy if exists "staff update invoices" on public.invoices;
drop policy if exists "staff delete invoices" on public.invoices;
drop policy if exists "unified invoices select" on public.invoices;
drop policy if exists "unified invoices insert" on public.invoices;
drop policy if exists "unified invoices update" on public.invoices;
drop policy if exists "unified invoices delete" on public.invoices;

create policy "unified invoices select" on public.invoices
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
);

create policy "unified invoices insert" on public.invoices
for insert to authenticated
with check (public.is_staff_email(auth.email()));

create policy "unified invoices update" on public.invoices
for update to authenticated
using (public.is_staff_email(auth.email()))
with check (public.is_staff_email(auth.email()));

create policy "unified invoices delete" on public.invoices
for delete to authenticated
using (public.is_staff_email(auth.email()));

-- documents

drop policy if exists "authenticated select documents" on public.documents;
drop policy if exists "authenticated insert documents" on public.documents;
drop policy if exists "authenticated update documents" on public.documents;
drop policy if exists "authenticated delete documents" on public.documents;
drop policy if exists "scoped select documents" on public.documents;
drop policy if exists "client upload documents" on public.documents;
drop policy if exists "staff or client update own documents" on public.documents;
drop policy if exists "staff or client delete own documents" on public.documents;
drop policy if exists "unified documents select" on public.documents;
drop policy if exists "unified documents insert" on public.documents;
drop policy if exists "unified documents update" on public.documents;
drop policy if exists "unified documents delete" on public.documents;

create policy "unified documents select" on public.documents
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
);

create policy "unified documents insert" on public.documents
for insert to authenticated
with check (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
);

create policy "unified documents update" on public.documents
for update to authenticated
using (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
)
with check (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
);

create policy "unified documents delete" on public.documents
for delete to authenticated
using (
  public.is_staff_email(auth.email())
  or client_id = public.current_client_id()
  or client_name = public.current_client_name()
);

-- expenses: internal only

drop policy if exists "authenticated select expenses" on public.expenses;
drop policy if exists "authenticated insert expenses" on public.expenses;
drop policy if exists "authenticated update expenses" on public.expenses;
drop policy if exists "authenticated delete expenses" on public.expenses;
drop policy if exists "staff only expenses select" on public.expenses;
drop policy if exists "staff only expenses insert" on public.expenses;
drop policy if exists "staff only expenses update" on public.expenses;
drop policy if exists "staff only expenses delete" on public.expenses;
drop policy if exists "unified expenses select" on public.expenses;
drop policy if exists "unified expenses insert" on public.expenses;
drop policy if exists "unified expenses update" on public.expenses;
drop policy if exists "unified expenses delete" on public.expenses;

create policy "unified expenses select" on public.expenses
for select to authenticated using (public.is_staff_email(auth.email()));
create policy "unified expenses insert" on public.expenses
for insert to authenticated with check (public.is_staff_email(auth.email()));
create policy "unified expenses update" on public.expenses
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
create policy "unified expenses delete" on public.expenses
for delete to authenticated using (public.is_staff_email(auth.email()));

-- future debts: internal only

drop policy if exists "unified future_debts select" on public.future_debts;
drop policy if exists "unified future_debts insert" on public.future_debts;
drop policy if exists "unified future_debts update" on public.future_debts;
drop policy if exists "unified future_debts delete" on public.future_debts;

create policy "unified future_debts select" on public.future_debts
for select to authenticated using (public.is_staff_email(auth.email()));
create policy "unified future_debts insert" on public.future_debts
for insert to authenticated with check (public.is_staff_email(auth.email()));
create policy "unified future_debts update" on public.future_debts
for update to authenticated using (public.is_staff_email(auth.email())) with check (public.is_staff_email(auth.email()));
create policy "unified future_debts delete" on public.future_debts
for delete to authenticated using (public.is_staff_email(auth.email()));

-- -------------------------------------------------------------------
-- 4) Storage buckets + private policies
-- -------------------------------------------------------------------

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
  ]::text[]
)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand', 'brand', false, 5242880, array['image/jpeg','image/png','image/webp']::text[])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read uploads" on storage.objects;
drop policy if exists "Authenticated can upload uploads" on storage.objects;
drop policy if exists "Authenticated can update uploads" on storage.objects;
drop policy if exists "Authenticated can delete uploads" on storage.objects;
drop policy if exists "scoped upload read" on storage.objects;
drop policy if exists "scoped upload insert" on storage.objects;
drop policy if exists "scoped upload update" on storage.objects;
drop policy if exists "scoped upload delete" on storage.objects;
drop policy if exists "unified storage read" on storage.objects;
drop policy if exists "unified storage insert" on storage.objects;
drop policy if exists "unified storage update" on storage.objects;
drop policy if exists "unified storage delete" on storage.objects;

create policy "unified storage read" on storage.objects
for select to authenticated
using (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);

create policy "unified storage insert" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);

create policy "unified storage update" on storage.objects
for update to authenticated
using (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
)
with check (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);

create policy "unified storage delete" on storage.objects
for delete to authenticated
using (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);

-- -------------------------------------------------------------------
-- 5) Optional realtime publication for unified tables
-- -------------------------------------------------------------------

do $$
begin
  begin alter publication supabase_realtime add table public.clients; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.cases; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.invoices; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.documents; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.expenses; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.future_debts; exception when duplicate_object then null; end;
end $$;

-- -------------------------------------------------------------------
-- Appended final hardening
-- -------------------------------------------------------------------
-- HELM Unified Stage 4: final security hardening for email login + client portal
-- نفذ هذا الملف بعد 001 إلى 010، أو نفذ FINAL_SECURITY_HARDENING.sql من جذر المشروع.

create or replace function public.is_staff_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where lower(up.email) = lower(target_email)
      and up.role in ('admin','staff','lawyer','assistant','secretary')
  );
$$;

revoke all on function public.is_staff_email(text) from public;
grant execute on function public.is_staff_email(text) to authenticated;

create or replace function public.is_admin_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where lower(up.email) = lower(target_email)
      and up.role = 'admin'
  );
$$;

revoke all on function public.is_admin_email(text) from public;
grant execute on function public.is_admin_email(text) to authenticated;

-- -------------------------------------------------------------------
-- 1) حماية جدول user_profiles من ترقية الصلاحية ذاتيًا
-- -------------------------------------------------------------------

alter table public.user_profiles enable row level security;

drop policy if exists "authenticated select user_profiles" on public.user_profiles;
drop policy if exists "authenticated insert user_profiles" on public.user_profiles;
drop policy if exists "authenticated update user_profiles" on public.user_profiles;
drop policy if exists "authenticated delete user_profiles" on public.user_profiles;
drop policy if exists "unified user_profiles select" on public.user_profiles;
drop policy if exists "unified user_profiles insert" on public.user_profiles;
drop policy if exists "unified user_profiles update" on public.user_profiles;
drop policy if exists "unified user_profiles delete" on public.user_profiles;

create policy "unified user_profiles select" on public.user_profiles
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or lower(email) = lower(auth.email())
);

create policy "unified user_profiles insert" on public.user_profiles
for insert to authenticated
with check (
  public.is_staff_email(auth.email())
  or lower(email) = lower(auth.email())
);

create policy "unified user_profiles update" on public.user_profiles
for update to authenticated
using (
  public.is_staff_email(auth.email())
  or lower(email) = lower(auth.email())
)
with check (
  public.is_staff_email(auth.email())
  or lower(email) = lower(auth.email())
);

create policy "unified user_profiles delete" on public.user_profiles
for delete to authenticated
using (public.is_admin_email(auth.email()));

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- عند التنفيذ من SQL Editor أو service role لا توجد قيمة auth.email، لذلك نسمح بالتعديل الإداري المباشر.
  if auth.email() is null then
    return new;
  end if;

  if old.role is distinct from new.role then
    if not public.is_admin_email(auth.email()) then
      raise exception 'غير مسموح بتعديل صلاحية الحساب إلا بواسطة مدير النظام.';
    end if;
  end if;

  if old.email is distinct from new.email then
    if not public.is_admin_email(auth.email()) then
      raise exception 'غير مسموح بتعديل بريد الحساب إلا بواسطة مدير النظام.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.user_profiles;
create trigger trg_prevent_self_role_escalation
before update on public.user_profiles
for each row execute function public.prevent_self_role_escalation();

-- -------------------------------------------------------------------
-- 2) ضبط notifications حتى لا يستطيع أي مستخدم تعديل تنبيهات غيره
-- -------------------------------------------------------------------

drop policy if exists "authenticated select notifications" on public.notifications;
drop policy if exists "authenticated insert notifications" on public.notifications;
drop policy if exists "authenticated update notifications" on public.notifications;
drop policy if exists "authenticated delete notifications" on public.notifications;
drop policy if exists "scoped select notifications" on public.notifications;
drop policy if exists "client insert own contact notification" on public.notifications;
drop policy if exists "unified notifications select" on public.notifications;
drop policy if exists "unified notifications insert" on public.notifications;
drop policy if exists "unified notifications update" on public.notifications;
drop policy if exists "unified notifications delete" on public.notifications;

create policy "unified notifications select" on public.notifications
for select to authenticated
using (
  public.is_staff_email(auth.email())
  or lower(user_email) = lower(auth.email())
  or lower(created_by) = lower(auth.email())
);

create policy "unified notifications insert" on public.notifications
for insert to authenticated
with check (
  public.is_staff_email(auth.email())
  or lower(user_email) = lower(auth.email())
  or lower(created_by) = lower(auth.email())
  or (reference_type = 'ClientContact' and lower(created_by) = lower(auth.email()))
);

create policy "unified notifications update" on public.notifications
for update to authenticated
using (
  public.is_staff_email(auth.email())
  or lower(user_email) = lower(auth.email())
  or lower(created_by) = lower(auth.email())
)
with check (
  public.is_staff_email(auth.email())
  or lower(user_email) = lower(auth.email())
  or lower(created_by) = lower(auth.email())
);

create policy "unified notifications delete" on public.notifications
for delete to authenticated
using (
  public.is_staff_email(auth.email())
  or lower(user_email) = lower(auth.email())
  or lower(created_by) = lower(auth.email())
);

-- -------------------------------------------------------------------
-- 3) تخزين خاص مع إتاحة قراءة المستند لصاحب العلاقة أو الموظف
-- -------------------------------------------------------------------

create or replace function public.can_read_storage_object(target_bucket text, target_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_staff_email(auth.email())
    or target_bucket = 'brand'
    or exists (
      select 1
      from public.documents d
      where d.file_url = ('storage://' || target_bucket || '/' || target_name)
        and (
          d.client_id = public.current_client_id()
          or d.client_name = public.current_client_name()
          or lower(d.created_by) = lower(auth.email())
        )
    );
$$;

revoke all on function public.can_read_storage_object(text, text) from public;
grant execute on function public.can_read_storage_object(text, text) to authenticated;

drop policy if exists "unified storage read" on storage.objects;
drop policy if exists "unified storage insert" on storage.objects;
drop policy if exists "unified storage update" on storage.objects;
drop policy if exists "unified storage delete" on storage.objects;

create policy "unified storage read" on storage.objects
for select to authenticated
using (
  bucket_id in ('uploads','brand')
  and (
    owner = auth.uid()
    or public.can_read_storage_object(bucket_id, name)
  )
);

create policy "unified storage insert" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);

create policy "unified storage update" on storage.objects
for update to authenticated
using (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
)
with check (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);

create policy "unified storage delete" on storage.objects
for delete to authenticated
using (
  bucket_id in ('uploads','brand')
  and (owner = auth.uid() or public.is_staff_email(auth.email()))
);
