-- Run this in your Supabase SQL editor to enable the Planning to Go feature
-- https://supabase.com/dashboard → SQL Editor

create table if not exists planned_visits (
  id uuid primary key default gen_random_uuid(),
  court_id integer not null,
  court_name text,
  player_name text not null,
  arrival_time timestamptz not null,
  duration text not null default '2',
  game_type text default 'Open run',
  message text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (allow all reads, allow inserts/updates)
alter table planned_visits enable row level security;

create policy "Public read" on planned_visits for select using (true);
create policy "Public insert" on planned_visits for insert with check (true);
create policy "Public update" on planned_visits for update using (true);

-- Enable realtime
alter publication supabase_realtime add table planned_visits;
