alter table public.assistant_configs
  add column personality_settings jsonb not null default '{
    "baseStyle": "default",
    "warm": "default",
    "enthusiastic": "default",
    "customInstructions": ""
  }'::jsonb;

update public.assistant_configs
set personality_settings = '{
  "baseStyle": "default",
  "warm": "default",
  "enthusiastic": "default",
  "customInstructions": ""
}'::jsonb
where personality_settings is null;
