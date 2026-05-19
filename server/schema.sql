-- Social Jukebox Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable realtime
alter publication supabase_realtime add table rooms, guests;

create table rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users not null,
  name text not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  is_active boolean default true,
  current_track jsonb,          -- { uri, title, artist, album_art, position_ms, is_playing }
  playback_source text check (playback_source in ('spotify', 'webrtc', 'none')) default 'none',
  created_at timestamptz default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(cascade) not null,
  display_name text not null,
  user_id uuid references auth.users,
  joined_at timestamptz default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms not null,
  code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  max_uses int default 50,
  use_count int default 0,
  expires_at timestamptz default now() + interval '24 hours',
  created_at timestamptz default now()
);

-- RLS
alter table rooms enable row level security;
alter table guests enable row level security;
alter table invites enable row level security;

-- Policies
create policy "host manages room"   on rooms for all   using (auth.uid() = host_id);
create policy "guests read room"    on rooms for select using (is_active = true);

create policy "anyone can join"     on guests for insert with check (true);
create policy "room members read"   on guests for select using (
  room_id in (select id from rooms where host_id = auth.uid() or is_active)
);

create policy "host creates invite" on invites for insert using (
  room_id in (select id from rooms where host_id = auth.uid())
);
create policy "anyone reads invite" on invites for select using (true);
create policy "host manages invite" on invites for update using (
  room_id in (select id from rooms where host_id = auth.uid())
);