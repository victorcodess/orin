insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'read-aloud',
  'read-aloud',
  false,
  10485760,
  array['audio/mpeg']
)
on conflict (id) do nothing;
