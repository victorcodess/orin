alter table public.conversations
  add column is_favorited boolean not null default false;

create index conversations_user_favorited_idx
  on public.conversations (user_id, is_favorited)
  where is_favorited = true;
