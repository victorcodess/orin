-- Orin initial schema

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  credits_balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Assistant configuration
create table public.assistant_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null default 'Orin',
  personality text not null,
  voice_id text not null,
  first_message text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_configs_user_unique unique (user_id)
);

alter table public.assistant_configs enable row level security;

create policy "Users can view own assistant config"
  on public.assistant_configs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own assistant config"
  on public.assistant_configs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own assistant config"
  on public.assistant_configs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Anyone can read default assistant config"
  on public.assistant_configs for select
  to anon, authenticated
  using (is_default = true);

-- Conversations
create type public.message_source as enum ('text', 'voice');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  session_id text,
  title text,
  active_voice_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_owner_check check (
    user_id is not null or session_id is not null
  )
);

create index conversations_user_id_idx on public.conversations (user_id);
create index conversations_session_id_idx on public.conversations (session_id);

alter table public.conversations enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  source public.message_source not null default 'text',
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Users can view messages in own conversations"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users can insert messages in own conversations"
  on public.messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

-- Usage metering
create type public.usage_type as enum ('text_tokens', 'stt_seconds', 'tts_chars', 'voice_minutes');

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  conversation_id uuid references public.conversations (id) on delete set null,
  type public.usage_type not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create index usage_events_user_id_idx on public.usage_events (user_id, created_at);

alter table public.usage_events enable row level security;

create policy "Users can view own usage"
  on public.usage_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Credit ledger
create type public.credit_transaction_type as enum ('purchase', 'grant', 'usage', 'refund');

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  type public.credit_transaction_type not null,
  stripe_payment_id text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index credit_transactions_user_id_idx on public.credit_transactions (user_id, created_at);

alter table public.credit_transactions enable row level security;

create policy "Users can view own credit transactions"
  on public.credit_transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed default Orin assistant config
insert into public.assistant_configs (
  user_id,
  name,
  personality,
  voice_id,
  first_message,
  is_default
) values (
  null,
  'Orin',
  'You are Orin — a warm, thoughtful companion. You listen carefully, remember context, and speak like a trusted friend or associate. You are curious, supportive, and honest. Keep responses concise unless the user wants depth. Never be robotic or overly formal.',
  'JBFqnCBsd6RMkjVDRZzb',
  'Hey — it''s Orin. What''s on your mind?',
  true
);

-- Enable Realtime for live transcript during calls
alter publication supabase_realtime add table public.messages;
