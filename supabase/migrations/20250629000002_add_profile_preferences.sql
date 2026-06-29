alter table public.profiles
  add column theme text not null default 'system'
    check (theme in ('system', 'light', 'dark')),
  add column language text not null default 'en',
  add column message_bubble_layout text not null default 'single-bubble'
    check (message_bubble_layout in ('single-bubble', 'both-bubbles'));
