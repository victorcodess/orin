-- Existing accounts should not be sent through onboarding after login.
update public.profiles
set onboarding_completed = true
where onboarding_completed = false;

-- App invokes merge via service role only.
revoke execute on function public.merge_anon_session_to_user(uuid, text) from authenticated;
