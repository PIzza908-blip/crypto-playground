
REVOKE EXECUTE ON FUNCTION public.bootstrap_profile(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_to_user(text, text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_check(text, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_check(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.swap_assets(text, text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(text, numeric, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_balance(text, text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
