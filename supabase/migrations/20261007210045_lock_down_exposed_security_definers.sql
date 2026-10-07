-- Diagnostic/reporting views must respect the caller's RLS context.
alter view public.helm_duplicate_clients set (security_invoker = true);
alter view public.helm_duplicate_invoices set (security_invoker = true);

-- Remove anonymous RPC access from SECURITY DEFINER functions.
revoke execute on function public.app_current_role() from public, anon;
revoke execute on function public.get_archive_counts() from public, anon;
revoke execute on function public.purge_old_archive(integer) from public, anon;

-- Trigger helpers are not public RPC endpoints.
revoke execute on function public.helm_audit_row_change() from public, anon, authenticated;
revoke execute on function public.helm_block_operations_manager_delete() from public, anon, authenticated;
revoke execute on function public.helm_protect_user_roles() from public, anon, authenticated;
revoke execute on function public.prevent_operations_manager_escalation() from public, anon, authenticated;

-- Preserve intentional authenticated application calls.
grant execute on function public.app_current_role() to authenticated, service_role;
grant execute on function public.get_archive_counts() to authenticated, service_role;
grant execute on function public.purge_old_archive(integer) to authenticated, service_role;
