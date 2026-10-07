-- Reconcile the production case/client junction without deleting or rewriting cases/clients.
insert into public.case_clients (case_id, client_id, relation_role, is_primary, created_by)
select
  c.id,
  cl.id,
  'موكل',
  true,
  'system-reconciliation'
from public.cases c
join public.clients cl
  on cl.id::text = c.client_id
left join public.case_clients cc
  on cc.case_id = c.id
 and cc.client_id = cl.id
where cc.id is null
on conflict (case_id, client_id) do update
set is_primary = true,
    relation_role = case
      when coalesce(public.case_clients.relation_role, '') = '' then 'موكل'
      else public.case_clients.relation_role
    end;

revoke all privileges on table public.case_clients from anon;

revoke all privileges on table public.case_clients from authenticated;
grant select, insert, update, delete on table public.case_clients to authenticated;

grant all privileges on table public.case_clients to service_role;

create unique index if not exists case_clients_one_primary_per_case
  on public.case_clients (case_id)
  where is_primary;
