create table if not exists public.badayat_feedback (
  id text primary key,
  type text not null default 'اقتراح',
  name text,
  phone text,
  email text,
  branch text,
  subject text,
  message text not null,
  status text not null default 'جديدة',
  created_at timestamptz not null default now()
);

create index if not exists idx_badayat_feedback_created_at on public.badayat_feedback(created_at desc);
create index if not exists idx_badayat_feedback_status on public.badayat_feedback(status);

alter table public.badayat_feedback enable row level security;

drop policy if exists "public insert badayat feedback" on public.badayat_feedback;
create policy "public insert badayat feedback"
on public.badayat_feedback
for insert
to anon, authenticated
with check (true);

drop policy if exists "staff select badayat feedback" on public.badayat_feedback;
create policy "staff select badayat feedback"
on public.badayat_feedback
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','staff','lawyer','assistant','secretary')
  )
);

drop policy if exists "staff update badayat feedback" on public.badayat_feedback;
create policy "staff update badayat feedback"
on public.badayat_feedback
for update
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','staff','lawyer','assistant','secretary')
  )
)
with check (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','staff','lawyer','assistant','secretary')
  )
);
