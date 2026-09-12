-- HELM Portal — إزالة آخر بريد مُثبَّت من مسند مدير التشغيل
-- تُشغّل بعد 023_operations_manager_flag.sql.

begin;

-- جسّد أي صلاحية انتقالية في العمود قبل حذف fallback النصي.
update public.user_profiles
   set is_operations_manager = true
 where is_operations_manager = false
   and (
     lower(email) = 'mahmoudmegally3@gmail.com'
     or role = 'operations_manager'
   );

-- لا نسمح باستبدال المسند إذا كان ذلك سيغيّر نتيجة الصلاحيات الحالية.
do $$
declare
  drifted integer;
  drift_emails text;
begin
  select count(*), string_agg(lower(p.email), ', ')
    into drifted, drift_emails
    from public.user_profiles p
   where (
           p.is_operations_manager
           or p.role = 'operations_manager'
           or lower(p.email) = 'mahmoudmegally3@gmail.com'
         )
     and not (
           p.is_operations_manager
           or p.role = 'operations_manager'
         );

  if drifted > 0 then
    raise exception
      'توقف: % حساب يمرّ بالمسند القديم ويرسب في الجديد (%). لم يُستبدل المسند.',
      drifted, drift_emails
      using errcode = '42501';
  end if;
end
$$;

create or replace function public.app_is_operations_manager()
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
      and (
        p.is_operations_manager
        or p.role = 'operations_manager'
      )
  );
$$;

revoke all on function public.app_is_operations_manager() from public;
revoke execute on function public.app_is_operations_manager() from anon;
grant execute on function public.app_is_operations_manager() to authenticated, service_role;

-- تحقّق أن التعريف الساري لم يعد يحوي بريدًا حرفيًا.
do $$
declare
  body text;
begin
  select pg_get_functiondef(p.oid)
    into body
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'app_is_operations_manager';

  if body is null then
    raise exception 'لم يُعثر على المسند app_is_operations_manager بعد الاستبدال.';
  end if;

  if body like '%@%' then
    raise exception 'المسند الساري ما زال يحوي ما يشبه بريدًا — راجع التعريف قبل الاعتماد عليه.';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
