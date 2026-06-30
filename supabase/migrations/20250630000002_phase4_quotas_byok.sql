-- Phase 4: onboarding flag, encrypted BYOK columns, anon session merge

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists openai_api_key_encrypted text,
  add column if not exists elevenlabs_api_key_encrypted text;

comment on column public.profiles.openai_api_key_encrypted is
  'AES-256-GCM encrypted OpenAI API key for BYOK after platform allowance is used.';
comment on column public.profiles.elevenlabs_api_key_encrypted is
  'AES-256-GCM encrypted ElevenLabs API key for BYOK after platform allowance is used.';

-- Allow merge_anon_session_to_user to reassign conversation ownership.
create or replace function public.enforce_conversation_owner_immutability()
returns trigger
language plpgsql
as $$
begin
  if current_setting('orin.allow_owner_merge', true) = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'conversation user_id is immutable';
  end if;

  if tg_op = 'UPDATE' and new.session_id is distinct from old.session_id then
    raise exception 'conversation session_id is immutable';
  end if;

  return new;
end;
$$;

create or replace function public.merge_anon_session_to_user(
  target_user_id uuid,
  anon_session_id text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  merged_count integer;
begin
  if anon_session_id is null or length(trim(anon_session_id)) = 0 then
    return 0;
  end if;

  perform set_config('orin.allow_owner_merge', 'on', true);

  update public.conversations
  set
    user_id = target_user_id,
    session_id = null,
    updated_at = now()
  where session_id = anon_session_id
    and user_id is null;

  get diagnostics merged_count = row_count;
  return merged_count;
end;
$$;

grant execute on function public.merge_anon_session_to_user(uuid, text) to service_role;
