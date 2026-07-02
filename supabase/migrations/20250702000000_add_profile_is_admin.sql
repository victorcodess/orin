-- Admin flag: bypass platform quota limits (set only via service role / SQL).

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'When true, platform quota checks are skipped. Only grant via service role or SQL.';

create or replace function public.protect_profile_is_admin()
returns trigger
language plpgsql
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  -- service_role API, dashboard SQL editor, and migrations may grant admin.
  if jwt_role = 'service_role'
     or session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_admin := false;
  elsif tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_is_admin on public.profiles;

create trigger protect_profile_is_admin
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_is_admin();
