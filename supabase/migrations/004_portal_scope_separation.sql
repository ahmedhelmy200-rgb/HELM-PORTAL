-- فصل بيانات حلمي بروتال عن بوابة بداية الخير داخل نفس قاعدة البيانات
-- شغّل هذا الملف بعد 001_init.sql و 002_client_portal_security.sql

alter table public.invoices add column if not exists portal_scope text not null default 'helm_portal';
alter table public.invoices add column if not exists business_unit text not null default 'helm_portal';

alter table public.cases add column if not exists portal_scope text not null default 'helm_portal';
alter table public.cases add column if not exists business_unit text not null default 'helm_portal';

alter table public.clients add column if not exists portal_scope text not null default 'helm_portal';
alter table public.clients add column if not exists business_unit text not null default 'helm_portal';

alter table public.documents add column if not exists portal_scope text not null default 'helm_portal';
alter table public.documents add column if not exists business_unit text not null default 'helm_portal';

alter table public.expenses add column if not exists portal_scope text not null default 'helm_portal';
alter table public.expenses add column if not exists business_unit text not null default 'helm_portal';

alter table public.tasks add column if not exists portal_scope text not null default 'helm_portal';
alter table public.tasks add column if not exists business_unit text not null default 'helm_portal';

-- تصنيف البيانات القديمة الخاصة ببداية الخير تلقائياً حسب النصوص المتاحة
update public.invoices
set portal_scope = 'badayat_al_khair', business_unit = 'badayat_al_khair'
where
  coalesce(office_name, '') ilike '%بداية الخير%'
  or coalesce(office_name, '') ilike '%بدايه الخير%'
  or coalesce(client_name, '') ilike '%بداية الخير%'
  or coalesce(case_title, '') ilike '%بداية الخير%'
  or coalesce(notes, '') ilike '%بداية الخير%'
  or coalesce(office_name, '') ilike '%badayat%'
  or coalesce(case_title, '') ilike '%badayat%';

update public.cases
set portal_scope = 'badayat_al_khair', business_unit = 'badayat_al_khair'
where
  coalesce(title, '') ilike '%بداية الخير%'
  or coalesce(client_name, '') ilike '%بداية الخير%'
  or coalesce(description, '') ilike '%بداية الخير%'
  or coalesce(title, '') ilike '%badayat%';

update public.clients
set portal_scope = 'badayat_al_khair', business_unit = 'badayat_al_khair'
where
  coalesce(full_name, '') ilike '%بداية الخير%'
  or coalesce(notes, '') ilike '%بداية الخير%'
  or coalesce(full_name, '') ilike '%badayat%';

update public.documents
set portal_scope = 'badayat_al_khair', business_unit = 'badayat_al_khair'
where
  coalesce(title, '') ilike '%بداية الخير%'
  or coalesce(case_title, '') ilike '%بداية الخير%'
  or coalesce(client_name, '') ilike '%بداية الخير%'
  or coalesce(notes, '') ilike '%بداية الخير%'
  or coalesce(title, '') ilike '%badayat%';

update public.expenses
set portal_scope = 'badayat_al_khair', business_unit = 'badayat_al_khair'
where
  coalesce(title, '') ilike '%بداية الخير%'
  or coalesce(case_title, '') ilike '%بداية الخير%'
  or coalesce(client_name, '') ilike '%بداية الخير%'
  or coalesce(notes, '') ilike '%بداية الخير%'
  or coalesce(title, '') ilike '%badayat%';

update public.tasks
set portal_scope = 'badayat_al_khair', business_unit = 'badayat_al_khair'
where
  coalesce(title, '') ilike '%بداية الخير%'
  or coalesce(case_title, '') ilike '%بداية الخير%'
  or coalesce(client_name, '') ilike '%بداية الخير%'
  or coalesce(description, '') ilike '%بداية الخير%'
  or coalesce(title, '') ilike '%badayat%';

-- فهارس خفيفة لتسريع الفلترة بين الأقسام
create index if not exists idx_invoices_portal_scope_created on public.invoices (portal_scope, created_date desc);
create index if not exists idx_invoices_business_unit_created on public.invoices (business_unit, created_date desc);
create index if not exists idx_cases_portal_scope_created on public.cases (portal_scope, created_date desc);
create index if not exists idx_clients_portal_scope_created on public.clients (portal_scope, created_date desc);
create index if not exists idx_documents_portal_scope_created on public.documents (portal_scope, created_date desc);
create index if not exists idx_expenses_portal_scope_created on public.expenses (portal_scope, created_date desc);
create index if not exists idx_tasks_portal_scope_created on public.tasks (portal_scope, created_date desc);
