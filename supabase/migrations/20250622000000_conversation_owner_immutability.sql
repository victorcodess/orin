-- Prevent clients from reassigning conversation ownership after insert.
create or replace function public.enforce_conversation_owner_immutability()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'conversation user_id is immutable';
  end if;

  if tg_op = 'UPDATE' and new.session_id is distinct from old.session_id then
    raise exception 'conversation session_id is immutable';
  end if;

  return new;
end;
$$;

create trigger conversations_owner_immutability
  before update on public.conversations
  for each row
  execute function public.enforce_conversation_owner_immutability();
