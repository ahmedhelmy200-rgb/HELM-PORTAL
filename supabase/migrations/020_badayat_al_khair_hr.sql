-- HELM Portal - Badayat Al Khair HR module
-- Run this migration in Supabase SQL editor before enabling full cloud sync.

create extension if not exists pgcrypto;

create table if not exists public.badayat_employees (
  id text primary key,
  branch_id text not null default 'dubai_mother',
  photo_url text,
  full_name text not null default 'موظف جديد',
  nationality text,
  emirates_id text,
  passport_no text,
  phone text,
  email text,
  job_title text,
  department text,
  work_location text,
  contract_type text,
  contract_start date,
  contract_end date,
  basic_salary numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  residency_status text,
  residency_expiry date,
  work_permit_expiry date,
  passport_held_voluntarily text default 'لا',
  penalties jsonb not null default '[]'::jsonb,
  rewards jsonb not null default '[]'::jsonb,
  rating numeric(5,2) default 0,
  notes text,
  created_by text default auth.email(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.badayat_audit (
  id uuid primary key default gen_random_uuid(),
  employee_id text references public.badayat_employees(id) on delete set null,
  employee_name text,
  action text not null,
  note text,
  created_by text default auth.email(),
  created_at timestamptz not null default now()
);

create index if not exists idx_badayat_employees_branch on public.badayat_employees(branch_id);
create index if not exists idx_badayat_employees_residency on public.badayat_employees(residency_expiry);
create index if not exists idx_badayat_employees_email on public.badayat_employees(email);
create index if not exists idx_badayat_audit_employee on public.badayat_audit(employee_id);

alter table public.badayat_employees enable row level security;
alter table public.badayat_audit enable row level security;

drop policy if exists "badayat staff select employees" on public.badayat_employees;
drop policy if exists "badayat staff insert employees" on public.badayat_employees;
drop policy if exists "badayat staff update employees" on public.badayat_employees;
drop policy if exists "badayat staff delete employees" on public.badayat_employees;
drop policy if exists "badayat staff select audit" on public.badayat_audit;
drop policy if exists "badayat staff insert audit" on public.badayat_audit;

create policy "badayat staff select employees"
  on public.badayat_employees for select
  using (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  );

create policy "badayat staff insert employees"
  on public.badayat_employees for insert
  with check (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  );

create policy "badayat staff update employees"
  on public.badayat_employees for update
  using (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  );

create policy "badayat staff delete employees"
  on public.badayat_employees for delete
  using (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  );

create policy "badayat staff select audit"
  on public.badayat_audit for select
  using (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  );

create policy "badayat staff insert audit"
  on public.badayat_audit for insert
  with check (
    exists (
      select 1 from public.user_profiles p
      where lower(p.email) = lower(auth.email())
      and p.role in ('admin','staff','lawyer','assistant','secretary')
    )
  );

insert into public.badayat_employees (
  id, branch_id, full_name, nationality, emirates_id, passport_no, phone, email,
  job_title, department, work_location, contract_type, contract_start, contract_end,
  basic_salary, allowances, deductions, residency_status, residency_expiry, work_permit_expiry,
  passport_held_voluntarily, penalties, rewards, rating, notes
) values
(
  'emp-001', 'dubai_mother', 'موظف تجريبي - الإدارة الأم', 'مصري', '784-0000-0000000-0', 'P0000000', '0500000000', 'employee@example.com',
  'إداري', 'الإدارة', 'دبي', 'دوام كامل', '2026-01-01', '2028-01-01',
  3500, 500, 0, 'سارية', '2027-06-30', '2027-06-30', 'لا',
  '[{"date":"2026-02-10","title":"تنبيه إداري","amount":0,"note":"تأخير بسيط"}]'::jsonb,
  '[{"date":"2026-03-01","title":"مكافأة انضباط","amount":250,"note":"التزام بالحضور"}]'::jsonb,
  86, 'ملف موظف قابل للتعديل من الشؤون القانونية.'
),
(
  'emp-002', 'showroom_1', 'موظف تجريبي - معرض 1', 'هندي', '784-1111-1111111-1', 'A1111111', '0550000000', 'sales@example.com',
  'مندوب مبيعات سيارات', 'المبيعات', 'معرض 1', 'عمولة وراتب', '2026-02-01', '2028-02-01',
  2800, 300, 0, 'تحتاج متابعة', '2026-08-15', '2026-08-15', 'لا',
  '[]'::jsonb, '[]'::jsonb, 78, 'يتم ربط العهد والسيارات المسلمة له لاحقاً.'
)
on conflict (id) do nothing;
