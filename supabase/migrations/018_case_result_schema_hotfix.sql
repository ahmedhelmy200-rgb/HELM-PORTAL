-- HELM Portal hotfix: case outcome fields required by the Cases form.
-- Safe to run more than once. Does not delete or rewrite existing case rows.

begin;

alter table if exists public.cases
  add column if not exists case_result text default 'غير محسومة';

alter table if exists public.cases
  add column if not exists success_percentage numeric;

alter table if exists public.cases
  add column if not exists result_notes text;

alter table if exists public.cases
  drop constraint if exists cases_success_percentage_range;

alter table if exists public.cases
  add constraint cases_success_percentage_range
  check (
    success_percentage is null
    or (success_percentage >= 0 and success_percentage <= 100)
  ) not valid;

create index if not exists idx_cases_case_result
  on public.cases(case_result);

create index if not exists idx_cases_success_percentage
  on public.cases(success_percentage);

-- Ask PostgREST/Supabase API to refresh its schema cache after the DDL commits.
notify pgrst, 'reload schema';

commit;
