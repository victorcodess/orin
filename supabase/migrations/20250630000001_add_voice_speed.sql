alter table public.assistant_configs
  add column if not exists voice_speed text not null default 'normal';

alter table public.assistant_configs
  add constraint assistant_configs_voice_speed_check
  check (voice_speed in ('slow', 'normal', 'fast'));
