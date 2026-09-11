-- HELM Portal — نقل صفة «مدير التشغيل» من الواجهة إلى قاعدة البيانات.
--
-- المشكلة: كانت الواجهة تقارن بريدًا شخصيًا مُثبَّتًا داخل حزمة المتصفح
-- (src/App.jsx و src/components/shared/ActionButtons.jsx) لتحديد هذه الصفة،
-- وهذا (أ) يكشف بريدًا شخصيًا لأي زائر، (ب) يجعل تغيير الصفة يحتاج إعادة نشر،
-- (ج) يجعل القاعدة والواجهة مصدرين مختلفين للحقيقة.
--
-- الحل: عمود واحد في user_profiles هو المصدر الوحيد للحقيقة، والواجهة تقرأه
-- من الملف الشخصي الذي تجلبه أصلًا. الحماية الفعلية للحذف وإدارة المستخدمين
-- موجودة في supabase/migrations/029 عبر app_current_role() والدعامات (triggers).
--
-- شغّل هذا الملف بعد 029 و 030.

begin;

-- -------------------------------------------------------------------
-- 1) عمود صفة مدير التشغيل
-- -------------------------------------------------------------------

alter table public.user_profiles
  add column if not exists is_operations_manager boolean not null default false;

-- -------------------------------------------------------------------
-- 2) تعيين مدير التشغيل الحالي (المكان الوحيد الذي يظهر فيه البريد)
-- -------------------------------------------------------------------

update public.user_profiles
   set is_operations_manager = true
 where lower(email) = 'mahmoudmegally3@gmail.com';

insert into public.user_profiles (email, full_name, role, is_operations_manager)
select 'mahmoudmegally3@gmail.com', 'محمود مجلي', 'staff', true
where not exists (
  select 1 from public.user_profiles where lower(email) = 'mahmoudmegally3@gmail.com'
);

-- -------------------------------------------------------------------
-- 3) منع ترقية أي حساب لنفسه إلى مدير تشغيل
--    (تعديل إداري من SQL Editor أو service_role مسموح لأنه لا يوجد auth.email)
-- -------------------------------------------------------------------

create or replace function public.prevent_operations_manager_escalation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.email() is null then
    return new;
  end if;

  if new.is_operations_manager is distinct from old.is_operations_manager then
    if not public.is_admin_email(auth.email()) then
      raise exception 'غير مسموح بتعديل صفة مدير التشغيل إلا بواسطة مدير النظام.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists trg_prevent_operations_manager_escalation on public.user_profiles;
create trigger trg_prevent_operations_manager_escalation
before update on public.user_profiles
for each row execute function public.prevent_operations_manager_escalation();

-- -------------------------------------------------------------------
-- 4) app_current_role يقرأ من العمود بدل مقارنة البريد
--    (نفس الاسم والتوقيع حتى تبقى دعامات 029 فعّالة بلا تغيير)
-- -------------------------------------------------------------------

create or replace function public.app_current_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when coalesce((
      select p.is_operations_manager
      from public.user_profiles p
      where lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      limit 1
    ), false)
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

-- -------------------------------------------------------------------
-- 5) تحقق سريع
-- -------------------------------------------------------------------

do $$
declare
  flag boolean;
  cnt  integer;
begin
  select count(*) into cnt from public.user_profiles where is_operations_manager;

  if cnt > 1 then
    raise warning 'يوجد أكثر من حساب بصفة مدير تشغيل (%) — راجع القائمة.', cnt;
  end if;

  select is_operations_manager into flag
    from public.user_profiles
   where lower(email) = 'mahmoudmegally3@gmail.com';

  if coalesce(flag, false) then
    raise notice 'تم تفعيل صفة مدير التشغيل بنجاح.';
  else
    raise warning 'لم يتم العثور على صف مدير التشغيل — راجع جدول user_profiles.';
  end if;
end
$$;

commit;

-- -------------------------------------------------------------------
-- للتراجع (إن احتجت):
--   alter table public.user_profiles drop column if exists is_operations_manager;
--   drop trigger if exists trg_prevent_operations_manager_escalation on public.user_profiles;
--   ثم أعد تنفيذ تعريف app_current_role من 029.
-- -------------------------------------------------------------------
