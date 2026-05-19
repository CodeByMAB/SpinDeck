-- Social Jukebox Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable realtime
alter publication supabase_realtime add table rooms, guests;

-- Rooms table with persistence support
create table rooms (
  id text primary key,
  host_id text not null,
  name text not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  is_active boolean default true,
  is_persistent boolean default false,
  current_track jsonb,          -- { uri, title, artist, album_art, position_ms, is_playing }
  queue jsonb default '[]',     -- Array of track objects
  playback_source text check (playback_source in ('youtube', 'spotify', 'apple_music', 'webrtc', 'none')) default 'none',
  settings jsonb default '{}',  -- Room settings (volume, etc.)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);

-- Guests table
create table guests (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  display_name text not null,
  user_id text,
  joined_at timestamptz default now(),
  is_muted boolean default true  -- For split audio feature
);

-- Room invites (for persistent rooms)
create table invites (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  max_uses int default 50,
  use_count int default 0,
  expires_at timestamptz default now() + interval '24 hours',
  created_at timestamptz default now()
);

-- User plans (for monetization)
create table user_plans (
  user_id text primary key,
  plan text default 'free' check (plan in ('free', 'pro', 'host')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index rooms_host_id on rooms(host_id);
create index rooms_invite_code on rooms(invite_code);
create index guests_room_id on guests(room_id);

-- RLS
alter table rooms enable row level security;
alter table guests enable row level security;
alter table invites enable row level security;
alter table user_plans enable row level security;

-- Policies
create policy "host manages room"   on rooms for all   using (auth.uid()::text = host_id);
create policy "guests read room"    on rooms for select using (is_active = true);

create policy "anyone can join"     on guests for insert with check (true);
create policy "room members read"   on guests for select using (
  room_id in (select id from rooms where host_id = auth.uid()::text or is_active)
);

create policy "host creates invite" on invites for insert using (
  room_id in (select id from rooms where host_id = auth.uid()::text)
);
create policy "anyone reads invite" on invites for select using (true);
create policy "host manages invite" on invites for update using (
  room_id in (select id from rooms where host_id = auth.uid()::text)
);

-- User plans policies
create policy "Users can read own plan" on user_plans for select using (auth.uid()::text = user_id);
create policy "Users can update own plan" on user_plans for all using (auth.uid()::text = user_id);