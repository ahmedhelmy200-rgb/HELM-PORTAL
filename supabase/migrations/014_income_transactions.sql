create table if not exists public.income_transactions (
  id text primary key,
  title text not null,
  amount numeric not null default 0,
  category text default 'دخل آخر',
  income_date date not null,
  source text default 'تحويل/إيداع بنكي',
  notes text,
  status text default 'محصل',
  bank_reference text,
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text
);

create index if not exists idx_income_transactions_income_date on public.income_transactions(income_date desc);
create index if not exists idx_income_transactions_bank_reference on public.income_transactions(bank_reference);

alter table public.income_transactions enable row level security;

drop policy if exists "staff select income transactions" on public.income_transactions;
create policy "staff select income transactions"
on public.income_transactions
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','staff','lawyer','assistant','secretary')
  )
);

drop policy if exists "staff insert income transactions" on public.income_transactions;
create policy "staff insert income transactions"
on public.income_transactions
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','staff','lawyer','assistant','secretary')
  )
);

drop policy if exists "staff update income transactions" on public.income_transactions;
create policy "staff update income transactions"
on public.income_transactions
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

drop policy if exists "staff delete income transactions" on public.income_transactions;
create policy "staff delete income transactions"
on public.income_transactions
for delete
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','staff','lawyer','assistant','secretary')
  )
);
