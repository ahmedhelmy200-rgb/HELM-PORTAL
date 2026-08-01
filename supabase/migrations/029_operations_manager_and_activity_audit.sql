-- HELM Portal: operations manager permissions for Mahmoud Megally.
-- The stored profile role remains "staff" for compatibility with the current app.
-- Database helpers identify Mahmoud's email as "operations_manager" and enforce stricter limits.

begin;

create extension if not exists pgcrypto;

create or replace function public.app_is_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_profiles p
    where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and p.role in ('admin', 'staff', 'lawyer', 'assistant', 'secretary')
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
    when lower(coalesce(auth.jwt() ->> 'email', '')) = 'mahmoudmegally3@gmail.com'
      then 'operations_manager'
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

-- Keep Mahmoud compatible with the current frontend's staff role recognition.
do $$
begin
  update public.user_profiles
     set role = 'staff',
         full_name = coalesce(nullif(full_name, ''), 'محمود مجلي')
   where lower(email) = 'mahmoudmegally3@gmail.com';

  if not found then
    begin
      insert into public.user_profiles (email, full_name, role)
      values ('mahmoudmegally3@gmail.com', 'محمود مجلي', 'staff');
    exception
      when not_null_violation or unique_violation then
        raise notice 'Mahmoud profile will be assigned staff after profile creation or migration rerun.';
    end;
  end if;
end
$$;

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  actor_role text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  occurred_at timestamptz not null default now()
);

create index if not exists idx_user_activity_logs_occurred_at
  on public.user_activity_logs (occurred_at desc);
create index if not exists idx_user_activity_logs_actor_email
  on public.user_activity_logs (lower(actor_email));
create index if not exists idx_user_activity_logs_table_record
  on public.user_activity_logs (table_name, record_id);

alter table public.user_activity_logs enable row level security;

drop policy if exists "staff read activity logs" on public.user_activity_logs;
create policy "staff read activity logs"
on public.user_activity_logs
for select
to authenticated
using (public.app_is_staff());

revoke insert, update, delete on public.user_activity_logs from anon, authenticated;
grant select on public.user_activity_logs to authenticated;

create or replace function public.helm_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', 'system'));
  v_user_id uuid := auth.uid();
  v_role text := public.app_current_role();
  v_old jsonb;
  v_new jsonb;
  v_record_id text;
  v_changed text[];
begin
  v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_record_id := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'case_number', v_old ->> 'case_number');

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), array[]::text[])
      into v_changed
      from (
        select key
        from jsonb_each(v_new)
        where (v_old -> key) is distinct from (v_new -> key)
      ) changed;
  else
    v_changed := null;
  end if;

  insert into public.user_activity_logs (
    actor_user_id, actor_email, actor_role, action, table_name,
    record_id, old_data, new_data, changed_fields
  ) values (
    v_user_id, v_email, v_role, tg_op, tg_table_name,
    v_record_id, v_old, v_new, v_changed
  );

  return coalesce(new, old);
end
$$;

create or replace function public.helm_block_operations_manager_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if public.app_current_role() = 'operations_manager' then
    raise exception 'مدير التشغيل غير مخول بحذف أي بيانات.' using errcode = '42501';
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
  if public.app_current_role() = 'operations_manager' then
    if tg_op = 'DELETE' then
      raise exception 'مدير التشغيل غير مخول بحذف المستخدمين.' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' or new.role is distinct from old.role or new.email is distinct from old.email then
      raise exception 'مدير التشغيل غير مخول بإدارة المستخدمين أو الأدوار.' using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end
$$;

do $$
begin
  if to_regclass('public.office_settings') is not null then
    execute 'alter table public.office_settings enable row level security';
    execute 'drop policy if exists "operations manager cannot access settings" on public.office_settings';
    execute $policy$
      create policy "operations manager cannot access settings"
      on public.office_settings
      as restrictive
      for all
      to authenticated
      using (public.app_current_role() <> 'operations_manager')
      with check (public.app_current_role() <> 'operations_manager')
    $policy$;
  end if;
end
$$;

do $$
declare
  t text;
  tracked_tables text[] := array[
    'cases', 'clients', 'contacts', 'sessions', 'documents', 'tasks',
    'invoices', 'expenses', 'income', 'events', 'notifications',
    'communications', 'messages', 'legal_templates', 'future_debts',
    'connection_requests', 'conversations'
  ];
begin
  foreach t in array tracked_tables loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists helm_audit_changes on public.%I', t);
      execute format(
        'create trigger helm_audit_changes after insert or update or delete on public.%I for each row execute function public.helm_audit_row_change()',
        t
      );
      execute format('drop trigger if exists helm_block_ops_delete on public.%I', t);
      execute format(
        'create trigger helm_block_ops_delete before delete on public.%I for each row execute function public.helm_block_operations_manager_delete()',
        t
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if to_regclass('public.user_profiles') is not null then
    execute 'drop trigger if exists helm_protect_user_roles on public.user_profiles';
    execute 'create trigger helm_protect_user_roles before insert or update or delete on public.user_profiles for each row execute function public.helm_protect_user_roles()';
    execute 'drop trigger if exists helm_audit_changes on public.user_profiles';
    execute 'create trigger helm_audit_changes after insert or update or delete on public.user_profiles for each row execute function public.helm_audit_row_change()';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
