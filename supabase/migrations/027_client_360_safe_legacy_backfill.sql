-- Safe Client 360 backfill for legacy name-only rows.
with unique_clients as (
  select lower(btrim(full_name)) as normalized_name,
         min(id::text) as client_id_text
  from public.clients
  where full_name is not null and btrim(full_name) <> ''
  group by lower(btrim(full_name))
  having count(*) = 1
)
update public.documents d
set client_id = u.client_id_text
from unique_clients u
where (d.client_id is null or btrim(d.client_id) = '')
  and d.client_name is not null
  and lower(btrim(d.client_name)) = u.normalized_name;
