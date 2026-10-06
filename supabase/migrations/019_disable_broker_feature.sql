-- HELM Portal: disable the retired broker feature without deleting historical rows.
-- Safe to run more than once. Existing records and legacy columns are preserved.

begin;

do $$
begin
  if to_regprocedure('public.assign_broker_role(text,text,text,numeric)') is not null then
    execute 'revoke all on function public.assign_broker_role(text, text, text, numeric) from public';
    execute 'revoke execute on function public.assign_broker_role(text, text, text, numeric) from anon, authenticated';
  end if;
end
$$;

do $$
begin
  if to_regclass('public.brokers') is not null then
    execute 'revoke all on table public.brokers from anon, authenticated';
    execute 'drop policy if exists "authenticated select brokers" on public.brokers';
    execute 'drop policy if exists "authenticated insert brokers" on public.brokers';
    execute 'drop policy if exists "authenticated update brokers" on public.brokers';
    execute 'drop policy if exists "authenticated delete brokers" on public.brokers';
    execute 'alter table public.brokers enable row level security';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
