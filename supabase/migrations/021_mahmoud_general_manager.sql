-- HELM Portal: promote Mahmoud Megally to full admin while preserving the agreed safeguards.
-- He remains blocked from Settings, deleting records, and managing user roles because
-- the restrictions are bound to his email, not only to the stored role value.

begin;

create or replace function public.app_is_operations_manager()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'mahmoudmegally3@gmail.com'
    or exists (
      select 1
      from public.user_profiles p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.role = 'operations_manager'
    );
$$;

revoke all on function public.app_is_operations_manager() from public;
grant execute on function public.app_is_operations_manager() to authenticated, service_role;

create or replace function public.app_is_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    public.app_is_operations_manager()
    or exists (
      select 1
      from public.user_profiles p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and p.role in ('admin', 'staff', 'lawyer', 'assistant', 'secretary', 'operations_manager')
    );
$$;

revoke all on function public.app_is_staff() from public;
grant execute on function public.app_is_staff() to authenticated, service_role;

create or replace function public.app_current_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when public.app_is_operations_manager() then 'operations_manager'
    else coalesce((
      select p.role
      from public.user_profiles p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      limit 1
    ), 'guest')
  end;
$$;

revoke all on function public.app_current_role() from public;
grant execute on function public.app_current_role() to authenticated, service_role;

create or replace function public.helm_block_operations_manager_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if public.app_is_operations_manager() then
    raise exception 'المدير العام غير مخول بحذف أي بيانات.' using errcode = '42501';
  end if;
  return old;
end
$$;

create or replace function public.helm_protect_user_roles()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if public.app_is_operations_manager() then
    if tg_op = 'DELETE' then
      raise exception 'المدير العام غير مخول بحذف المستخدمين.' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' then
      raise exception 'المدير العام غير مخول بإضافة المستخدمين.' using errcode = '42501';
    end if;
    if new.role is distinct from old.role or new.email is distinct from old.email then
      raise exception 'المدير العام غير مخول بتغيير المستخدمين أو الأدوار.' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

update public.user_profiles
set role = 'admin',
    full_name = coalesce(nullif(trim(full_name), ''), 'محمود مجلي')
where lower(email) = 'mahmoudmegally3@gmail.com';

notify pgrst, 'reload schema';
commit;
