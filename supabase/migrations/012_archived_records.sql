-- ═══════════════════════════════════════════════════════════════════════════
-- HELM Portal — Migration 012: جدول الأرشيف (archived_records)
-- ترقية نظام الأرشيف من localStorage إلى Supabase
-- ملاحظة: تم ترقيمها 012 لتفادي التعارض مع migrations 010/011 الموجودة
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 0) تنظيف: إزالة أي سياسات أو فهارس قديمة إن وُجدت
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "staff_can_manage_archive" on public.archived_records;
drop policy if exists "archived_records staff select" on public.archived_records;
drop policy if exists "archived_records staff insert" on public.archived_records;
drop policy if exists "archived_records staff update" on public.archived_records;
drop policy if exists "archived_records staff delete" on public.archived_records;
drop policy if exists "archived_records admin delete" on public.archived_records;
drop index if exists public.idx_archived_records_entity;
drop index if exists public.idx_archived_records_archived_by;
drop index if exists public.idx_archived_records_archived_at;
drop index if exists public.idx_archived_records_record_lookup;
drop index if exists public.idx_archived_unique_active;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) إنشاء الجدول
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.archived_records (
  id            uuid        primary key default gen_random_uuid(),

  entity_name   text        not null,
  entity_label  text,
  record_id     text        not null,
  record_data   jsonb       not null,

  archived_by   text        not null,
  archived_at   timestamptz not null default timezone('utc', now()),
  restored_at   timestamptz,
  restored_by   text,

  is_permanent  boolean     not null default false,
  deleted_at    timestamptz,
  deleted_by    text,

  note          text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) قيد فريد: منع تكرار أرشفة نفس السجل من نفس الكيان
-- ─────────────────────────────────────────────────────────────────────────────

create unique index if not exists idx_archived_unique_active
  on public.archived_records (entity_name, record_id)
  where is_permanent = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) فهارس الأداء
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists idx_archived_records_entity
  on public.archived_records (entity_name)
  where is_permanent = false;

create index if not exists idx_archived_records_archived_by
  on public.archived_records (archived_by)
  where is_permanent = false;

create index if not exists idx_archived_records_archived_at
  on public.archived_records (archived_at desc)
  where is_permanent = false;

create index if not exists idx_archived_records_record_lookup
  on public.archived_records (record_id, entity_name);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) تفعيل RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.archived_records enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) سياسات الوصول RLS
-- الموكلون لا يرون الأرشيف — فقط أدوار الفريق
-- ─────────────────────────────────────────────────────────────────────────────

create policy "archived_records staff select"
  on public.archived_records
  for select
  to authenticated
  using (
    public.is_staff_email(auth.email())
    and is_permanent = false
  );

create policy "archived_records staff insert"
  on public.archived_records
  for insert
  to authenticated
  with check (
    public.is_staff_email(auth.email())
    and lower(archived_by) = lower(auth.email())
  );

create policy "archived_records staff update"
  on public.archived_records
  for update
  to authenticated
  using  (public.is_staff_email(auth.email()))
  with check (public.is_staff_email(auth.email()));

create policy "archived_records admin delete"
  on public.archived_records
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where lower(email) = lower(auth.email())
        and role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) دوال مساعدة آمنة
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_archive_counts()
returns table (entity_name text, entity_label text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    ar.entity_name,
    max(ar.entity_label) as entity_label,
    count(*)             as count
  from public.archived_records ar
  where ar.is_permanent = false
    and ar.restored_at is null
    and public.is_staff_email(auth.email())
  group by ar.entity_name
  order by count desc;
$$;

revoke all on function public.get_archive_counts() from public;
grant execute on function public.get_archive_counts() to authenticated;

create or replace function public.purge_old_archive(older_than_days int default 90)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  if not exists (
    select 1 from public.user_profiles
    where lower(email) = lower(auth.email()) and role = 'admin'
  ) then
    raise exception 'صلاحيات غير كافية — هذه العملية لـ admin فقط';
  end if;

  update public.archived_records
  set
    is_permanent = true,
    deleted_at   = timezone('utc', now()),
    deleted_by   = auth.email()
  where
    is_permanent = false
    and restored_at is null
    and archived_at < (timezone('utc', now()) - (older_than_days || ' days')::interval);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.purge_old_archive(int) from public;
grant execute on function public.purge_old_archive(int) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7) Realtime — إضافة آمنة بدون كسر التكرار
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication p
      join pg_publication_rel pr on pr.prpubid = p.oid
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = 'archived_records'
    ) then
      alter publication supabase_realtime add table public.archived_records;
    end if;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8) تعليقات توضيحية
-- ─────────────────────────────────────────────────────────────────────────────

comment on table  public.archived_records              is 'الأرشيف — حذف ناعم مع إمكانية الاسترجاع لكل سجلات HELM';
comment on column public.archived_records.entity_name  is 'اسم الكيان: Case | Client | Invoice | Document | Session | Task | Expense';
comment on column public.archived_records.record_data  is 'نسخة JSONB كاملة من السجل وقت الأرشفة';
comment on column public.archived_records.is_permanent is 'true = حذف نهائي لا رجعة فيه، false = في الأرشيف قابل للاسترجاع';

-- ✅ انتهى — الجدول جاهز
