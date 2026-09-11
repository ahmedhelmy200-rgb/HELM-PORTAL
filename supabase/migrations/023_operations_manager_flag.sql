-- HELM Portal — نقل صفة «مدير التشغيل / المدير العام» من الواجهة إلى قاعدة البيانات.
--
-- المشكلة: كانت الواجهة تقارن بريدًا شخصيًا مُثبَّتًا داخل حزمة المتصفح
-- (src/App.jsx و src/components/shared/ActionButtons.jsx) لتحديد هذه الصفة،
-- وهذا (أ) يكشف بريدًا شخصيًا لأي زائر، (ب) يجعل تغيير الصفة يحتاج إعادة نشر،
-- (ج) يجعل القاعدة والواجهة مصدرين مختلفين للحقيقة.
--
-- الحل: عمود واحد في user_profiles هو المصدر الوحيد للحقيقة، والواجهة تقرأه
-- من الملف الشخصي الذي تجلبه أصلًا.
--
-- ملاحظة مهمة على التصميم: نستبدل هنا دالة واحدة فقط هي app_is_operations_manager()
-- لأنها المسند (predicate) المخصّص لهذا السؤال. كل ما بُني عليها في 020 و 021
-- (app_current_role و app_is_staff ودعامتا الحذف وحماية الأدوار) يقرأ منها تلقائيًا،
-- فلا نحتاج تعديل أي منها، ونحافظ على شرط role = 'operations_manager' كما هو.
--
-- شغّل هذا الملف بعد 020 و 021 و 022 (أي بعد كل ما قبله).

begin;

-- -------------------------------------------------------------------
-- 1) عمود صفة مدير التشغيل
-- -------------------------------------------------------------------

alter table public.user_profiles
  add column if not exists is_operations_manager boolean not null default false;

-- -------------------------------------------------------------------
-- 2) تعيين الصفة — المكان الوحيد الذي يظهر فيه البريد داخل قاعدة البيانات
-- -------------------------------------------------------------------

update public.user_profiles
   set is_operations_manager = true
 where lower(email) = 'mahmoudmegally3@gmail.com'
    or role = 'operations_manager';

-- في حال كان الجدول فارغًا تمامًا في بيئة جديدة، ننشئ الصف الأساسي.
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
-- 4) المسند الوحيد: app_is_operations_manager() يقرأ من العمود
--    مع الحفاظ على الشرطين السابقين من 020 و 021:
--      - البريد المطابق (يبقى كشبكة أمان إن لم يُنفَّذ التحديث أعلاه)
--      - role = 'operations_manager'
-- -------------------------------------------------------------------

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
        or lower(p.email) = 'mahmoudmegally3@gmail.com'
      )
  );
$$;

revoke all on function public.app_is_operations_manager() from public;
grant execute on function public.app_is_operations_manager() to authenticated, service_role;

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
   where lower(email) = 'mahmoudmegally3@gmail.com'
   limit 1;

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
--   1) أعد تعريف app_is_operations_manager من 021.
--   2) drop trigger if exists trg_prevent_operations_manager_escalation on public.user_profiles;
--   3) alter table public.user_profiles drop column if exists is_operations_manager;
-- -------------------------------------------------------------------
