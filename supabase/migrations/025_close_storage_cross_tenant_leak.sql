-- HELM Portal — إغلاق ثغرة عزل مستندات الموكّلين في storage.objects
-- تُشغّل بعد 024_lock_down_operations_manager_predicate.sql.

begin;

-- 1) طبّع روابط Supabase Storage المخزنة داخل documents.file_url إلى storage://
do $$
declare
  normalized integer;
begin
  with target as (
    select id,
           regexp_replace(
             file_url,
             '^https?://[^/]+/storage/v1/object/(?:sign|public|authenticated)/([^?#]+).*$',
             'storage://\1'
           ) as fixed
      from public.documents
     where file_url ~ '^https?://[^/]+/storage/v1/object/(sign|public|authenticated)/'
  )
  update public.documents d
     set file_url = t.fixed
    from target t
   where d.id = t.id;

  get diagnostics normalized = row_count;
  raise notice 'طُبّعت % صفًا من روابط التخزين إلى storage://', normalized;
end
$$;

-- 2) لا نحذف السياسات القديمة إلا إذا كانت العائلة الصارمة والدالة الداعمة موجودة.
do $$
declare
  missing text;
begin
  select string_agg(want, ', ')
    into missing
    from unnest(array[
      'unified storage read',
      'unified storage insert',
      'unified storage update',
      'unified storage delete'
    ]) as want
   where not exists (
     select 1
       from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname = want
   );

  if missing is not null then
    raise exception
      'توقف: سياسات التخزين الصارمة مفقودة (%). لم يُحذف شيء.', missing
      using errcode = '42501';
  end if;

  if to_regprocedure('public.can_read_storage_object(text,text)') is null then
    raise exception 'توقف: الدالة can_read_storage_object(text,text) مفقودة.' using errcode = '42501';
  end if;

  if not exists (select 1 from storage.buckets where id = 'uploads' and public = false) then
    raise exception 'توقف: حاوية uploads غير موجودة أو ليست private.' using errcode = '42501';
  end if;
end
$$;

-- 3) إزالة كل السياسات القديمة المتسامحة التي تسمح لمستخدم authenticated دون تحقق هوية/ملكية.
drop policy if exists "Enable insert for authenticated users only" on storage.objects;
drop policy if exists "authenticated users can delete" on storage.objects;
drop policy if exists "authenticated users can read" on storage.objects;
drop policy if exists "authenticated users can upload" on storage.objects;
drop policy if exists helm_phase1_uploads_read on storage.objects;
drop policy if exists helm_phase1_uploads_insert on storage.objects;
drop policy if exists helm_phase1_uploads_update on storage.objects;
drop policy if exists "owner insert own uploads" on storage.objects;

-- 4) توكيد حاسم: لا تبقى أي سياسة PERMISSIVE للـ authenticated بلا تحقق هوية/ملكية.
do $$
declare
  offenders text;
begin
  select string_agg(policyname, ', ' order by policyname)
    into offenders
    from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and permissive = 'PERMISSIVE'
     and 'authenticated' = any(roles)
     and (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
         !~ 'auth\.uid\(\)|owner|owner_id|can_read_storage_object|is_staff_email|helm_is_staff|current_client_id|current_client_name';

  if offenders is not null then
    raise exception
      'توقف: ما زالت سياسات تخزين غير مقيّدة بالهوية: %', offenders
      using errcode = '42501';
  end if;
end
$$;

-- 5) تشخيص المراجع غير القياسية؛ لا نفشل لأنها قد تكون روابط خارجية مشروعة.
do $$
declare
  orphans integer;
begin
  select count(*)
    into orphans
    from public.documents d
   where d.file_url is not null
     and btrim(d.file_url) <> ''
     and d.file_url !~ '^storage://';

  if orphans > 0 then
    raise warning '% صفًا في documents.file_url ليست بصيغة storage://؛ راجعها إن كانت ملفات داخلية.', orphans;
  else
    raise notice 'لا توجد مراجع تخزين داخلية غير قياسية.';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
