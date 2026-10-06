-- HELM Client 360
-- Adds a legal relationship role to clients and stable client linkage to expenses.

alter table public.clients
  add column if not exists client_role text default 'موكل';

update public.clients
set client_role = 'موكل'
where client_role is null or btrim(client_role) = '';

alter table public.expenses
  add column if not exists client_id text;

with unique_clients as (
  select lower(btrim(full_name)) as normalized_name,
         min(id::text) as client_id
  from public.clients
  where full_name is not null and btrim(full_name) <> ''
  group by lower(btrim(full_name))
  having count(*) = 1
)
update public.expenses e
set client_id = u.client_id
from unique_clients u
where e.client_id is null
  and e.client_name is not null
  and lower(btrim(e.client_name)) = u.normalized_name;

create index if not exists idx_clients_client_role
  on public.clients (client_role);

create index if not exists idx_expenses_client_id
  on public.expenses (client_id);
