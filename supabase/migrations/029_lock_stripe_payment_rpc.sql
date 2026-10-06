-- Lock Stripe payment application RPC to the service role only.
revoke execute on function public.apply_stripe_payment(text, uuid, numeric) from public;
revoke execute on function public.apply_stripe_payment(text, uuid, numeric) from anon;
revoke execute on function public.apply_stripe_payment(text, uuid, numeric) from authenticated;
grant execute on function public.apply_stripe_payment(text, uuid, numeric) to service_role;
