-- Сід реєстру сервісів. Відредагуй під себе і застосуй: psql "$OREN_DB_URL" -f supabase/seed.sql
insert into oren.service (id, kind, name, base_url) values
  ('srv-main',      'server',   'Сервер',   null),
  ('n8n-unowa',     'n8n',      'n8n',      'https://n8n.example.com'),
  ('supabase-main', 'supabase', 'Supabase', 'https://supabase.example.com'),
  ('clickup',       'clickup',  'ClickUp',  'https://app.clickup.com'),
  ('agents',        'agents',   'Агенти',   'https://github.com')
on conflict (id) do update set name = excluded.name, base_url = excluded.base_url;
