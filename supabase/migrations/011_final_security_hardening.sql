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
