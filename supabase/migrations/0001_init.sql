-- OREN: базова схема. Застосувати: psql "$OREN_DB_URL" -f supabase/migrations/0001_init.sql
-- Після застосування додати 'oren' до PGRST_DB_SCHEMAS (self-hosted Supabase)
-- або Dashboard → Settings → API → Exposed schemas (cloud), інакше PostgREST схему не бачить.

create schema if not exists oren;

-- Реєстр того, що моніторимо
create table if not exists oren.service (
  id          text primary key,
  kind        text not null check (kind in ('server','n8n','supabase','clickup','agents')),
  name        text not null,
  base_url    text,
  enabled     boolean not null default true,
  config      jsonb not null default '{}'
);

-- Append-only часовий ряд
create table if not exists oren.metric_snapshot (
  id          bigint generated always as identity primary key,
  service_id  text not null references oren.service(id),
  metric      text not null,
  value       numeric,
  labels      jsonb not null default '{}',
  at          timestamptz not null default now()
);
create index if not exists metric_snapshot_lookup
  on oren.metric_snapshot (service_id, metric, at desc);

-- Кеш поточного стану (дашборд читає переважно її)
create table if not exists oren.service_status (
  service_id  text primary key references oren.service(id),
  status      text not null check (status in ('ok','warn','error','unknown')),
  summary     jsonb not null default '{}',
  checked_at  timestamptz not null
);

-- Нормалізовані події
create table if not exists oren.event (
  id          bigint generated always as identity primary key,
  service_id  text not null references oren.service(id),
  level       text not null check (level in ('info','warn','error')),
  kind        text not null,
  title       text not null,
  detail      jsonb not null default '{}',
  external_id text,
  at          timestamptz not null,
  unique (service_id, kind, external_id)
);
create index if not exists event_recent on oren.event (at desc);

-- Кеш ClickUp time entries
create table if not exists oren.time_entry (
  id          text primary key,
  task_id     text,
  task_name   text,
  list_name   text,
  started_at  timestamptz,
  duration_ms bigint,
  raw         jsonb not null default '{}'
);

-- RLS: авторизований користувач читає; пише тільки колектор (service_role обходить RLS)
alter table oren.service        enable row level security;
alter table oren.metric_snapshot enable row level security;
alter table oren.service_status enable row level security;
alter table oren.event          enable row level security;
alter table oren.time_entry     enable row level security;

grant usage on schema oren to authenticated, anon, service_role;
grant select on all tables in schema oren to authenticated;
grant all on all tables in schema oren to service_role;
grant usage, select on all sequences in schema oren to service_role;
alter default privileges in schema oren grant select on tables to authenticated;
alter default privileges in schema oren grant all on tables to service_role;

create policy "authenticated can read service"
  on oren.service for select to authenticated using (true);
create policy "authenticated can read metric_snapshot"
  on oren.metric_snapshot for select to authenticated using (true);
create policy "authenticated can read service_status"
  on oren.service_status for select to authenticated using (true);
create policy "authenticated can read event"
  on oren.event for select to authenticated using (true);
create policy "authenticated can read time_entry"
  on oren.time_entry for select to authenticated using (true);
