-- HELM Portal — فحص حيّ بعد النشر
-- للقراءة فقط. شغّله بعد أي نشر أو تعديل هجرات.

with expected_tables(name) as (
  values
    ('user_profiles'),('cases'),('clients'),('connection_requests'),('conversations'),
    ('documents'),('events'),('expenses'),('founder_profiles'),('invoices'),
    ('legal_templates'),('messages'),('notifications'),('office_settings'),('sessions'),
    ('tasks'),('future_debts'),('income_transactions'),('contacts'),('brokers'),
    ('user_activity_logs'),('social_connections'),('social_connection_secrets'),
    ('social_oauth_states'),('social_posts'),('archived_records')
), checks as (

  select 10 as ord,
         'الجداول الأساسية الـ26 موجودة' as check_name,
         case when count(*) = 0 then 'PASS' else 'FAIL' end as status,
         case when count(*) = 0 then '26/26 موجودة'
              else 'مفقود: ' || string_agg(e.name, ', ') end as detail
    from expected_tables e
   where to_regclass('public.' || e.name) is null

  union all

  select 20,
         'صفر جدول public بلا RLS',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce(string_agg(c.relname::text, ', '), 'كل الجداول محمية')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and not c.relrowsecurity

  union all

  select 30,
         'لا جدول أساسي مقفل بلا سياسة بالخطأ',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce(string_agg(e.name, ', '), 'لا شيء خارج المقصود')
    from expected_tables e
   where e.name not in ('social_connection_secrets', 'social_oauth_states')
     and exists (
       select 1
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = e.name
          and c.relrowsecurity
     )
     and not exists (
       select 1
         from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = e.name
     )

  union all

  select 40,
         'لا بريد مُثبّت في أي دالة public',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce(string_agg(p.proname::text, ', '), 'نظيف')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prokind = 'f'
     and pg_get_functiondef(p.oid)
         ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'

  union all

  select 50,
         'عمود is_operations_manager موجود',
         case when count(*) = 1 then 'PASS' else 'FAIL' end,
         case when count(*) = 1 then 'موجود' else 'مفقود' end
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'user_profiles'
     and column_name = 'is_operations_manager'

  union all

  select 60,
         'حسابات مدير التشغيل مضبوطة',
         case when count(*) = 1 then 'PASS'
              when count(*) = 0 then 'FAIL'
              else 'WARN' end,
         count(*)::text || ' حساب'
    from public.user_profiles
   where is_operations_manager

  union all

  select 70,
         'الدوال الحرجة معرّفة',
         case when count(distinct p.proname) = 5 then 'PASS' else 'FAIL' end,
         count(distinct p.proname)::text || ' من 5'
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in (
       'app_is_operations_manager',
       'app_current_role',
       'is_admin_email',
       'prevent_operations_manager_escalation',
       'can_read_storage_object'
     )

  union all

  select 80,
         'uploads و brand موجودتان وPrivate',
         case when count(*) = 2 and bool_and(public = false) then 'PASS' else 'FAIL' end,
         coalesce(
           string_agg(id::text || ':' || case when public then 'public' else 'private' end, ' · '),
           'لا شيء'
         )
    from storage.buckets
   where id in ('uploads', 'brand')

  union all

  select 90,
         'جدولا أسرار Meta بلا سياسات',
         case when count(*) = 0 then 'PASS' else 'WARN' end,
         coalesce(string_agg(distinct tablename::text, ', '), 'مغلقان تمامًا')
    from pg_policies
   where schemaname = 'public'
     and tablename in ('social_connection_secrets', 'social_oauth_states')

  union all

  select 100,
         'صفر سياسة Storage متسامحة بلا تحقق هوية',
         case when count(*) = 0 then 'PASS' else 'FAIL' end,
         coalesce(string_agg(policyname::text, ', ' order by policyname), 'كل السياسات مقيّدة')
    from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and permissive = 'PERMISSIVE'
     and 'authenticated' = any(roles)
     and (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
         !~ 'auth\.uid\(\)|owner|owner_id|can_read_storage_object|is_staff_email|helm_is_staff|current_client_id|current_client_name'

  union all

  select 110,
         'مراجع المستندات الداخلية قياسية',
         case
           when count(*) filter (
             where file_url is not null
               and btrim(file_url) <> ''
               and file_url !~ '^storage://'
           ) > 0 then 'WARN'
           when count(*) filter (
             where file_url is not null and btrim(file_url) <> ''
           ) = 0 then 'WARN'
           else 'PASS'
         end,
         count(*) filter (
           where file_url is not null and btrim(file_url) <> ''
         )::text || ' مملوء · ' ||
         count(*) filter (
           where file_url is not null
             and btrim(file_url) <> ''
             and file_url !~ '^storage://'
         )::text || ' غير قياسي'
    from public.documents

  union all

  select 120,
         'لا توجد Buckets عامة غير متوقعة',
         case when count(*) = 0 then 'PASS' else 'WARN' end,
         coalesce(string_agg(id::text, ', ' order by id), 'لا يوجد')
    from storage.buckets
   where public = true
), out as (
  select * from checks
  union all
  select 999,
         '— الملخّص —',
         case when count(*) filter (where status = 'FAIL') = 0 then 'PASS' else 'FAIL' end,
         count(*) filter (where status = 'FAIL')::text || ' فشل · ' ||
         count(*) filter (where status = 'WARN')::text || ' تحذير · ' ||
         count(*) filter (where status = 'PASS')::text || ' نجاح'
    from checks
)
select ord,
       case status when 'PASS' then '✅ PASS'
                   when 'WARN' then '⚠️ WARN'
                   else '❌ FAIL' end as "النتيجة",
       check_name as "الفحص",
       detail as "التفصيل"
  from out
 order by ord;
