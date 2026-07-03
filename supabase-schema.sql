-- FutComuna Stats - Schema completo
-- Execute no Supabase SQL Editor

-- ============================================================
-- TABELA: profiles
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  shirt_number int,
  dominant_foot text not null default 'direito' check (dominant_foot in ('direito', 'esquerdo', 'ambos')),
  birth_date date,
  city text,
  primary_position text not null check (primary_position in ('goleiro','zagueiro','lateral','volante','meia','meia_ofensivo','atacante')),
  secondary_position text check (secondary_position in ('goleiro','zagueiro','lateral','volante','meia','meia_ofensivo','atacante')),
  role text not null default 'player' check (role in ('player', 'admin')),
  overall int not null default 60,
  pac int not null default 60,
  sho int not null default 60,
  pas int not null default 60,
  dri int not null default 60,
  def int not null default 60,
  phy int not null default 60,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: rounds (rodadas)
-- ============================================================
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  date date not null,
  location text,
  status text not null default 'pending' check (status in ('pending', 'active', 'finished')),
  mvp_player_id uuid references profiles(id),
  top_scorer_id uuid references profiles(id),
  created_by uuid references profiles(id) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: presence (confirmações de presença)
-- ============================================================
create table if not exists presence (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade not null,
  player_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'maybe' check (status in ('confirmed', 'absent', 'maybe')),
  updated_at timestamptz not null default now(),
  unique(round_id, player_id)
);

-- ============================================================
-- TABELA: matches (partidas)
-- ============================================================
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade not null,
  match_number int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'active', 'finished')),
  team_blue_score int not null default 0,
  team_black_score int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  end_reason text check (end_reason in ('time', 'goals', 'manual')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: teams
-- ============================================================
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade not null,
  color text not null check (color in ('blue', 'black')),
  unique(match_id, color)
);

-- ============================================================
-- TABELA: team_players
-- ============================================================
create table if not exists team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  player_id uuid references profiles(id) on delete cascade not null,
  match_id uuid references matches(id) on delete cascade not null,
  unique(match_id, player_id)
);

-- ============================================================
-- TABELA: goals
-- ============================================================
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade not null,
  scorer_id uuid references profiles(id) not null,
  assist_player_id uuid references profiles(id),
  scored_at_second int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: player_stats
-- ============================================================
create table if not exists player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id) on delete cascade not null,
  season int not null,
  games_played int not null default 0,
  wins int not null default 0,
  draws int not null default 0,
  losses int not null default 0,
  goals int not null default 0,
  assists int not null default 0,
  goal_participations int not null default 0,
  goals_conceded int not null default 0,
  games_with_goals int not null default 0,
  win_streak int not null default 0,
  max_win_streak int not null default 0,
  unbeaten_streak int not null default 0,
  max_unbeaten_streak int not null default 0,
  minutes_played int not null default 0,
  mvp_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(player_id, season)
);

-- ============================================================
-- TABELA: achievements
-- ============================================================
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  condition_type text not null,
  condition_value int not null default 1
);

-- ============================================================
-- TABELA: player_achievements
-- ============================================================
create table if not exists player_achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id) on delete cascade not null,
  achievement_id uuid references achievements(id) on delete cascade not null,
  earned_at timestamptz not null default now(),
  unique(player_id, achievement_id)
);

-- ============================================================
-- TABELA: notifications
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGER: criar perfil ao registrar usuário
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, primary_position, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Jogador'),
    coalesce(new.raw_user_meta_data->>'primary_position', 'atacante'),
    'player'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TRIGGER: criar stats ao criar perfil
-- ============================================================
create or replace function handle_new_profile()
returns trigger language plpgsql security definer as $$
begin
  insert into player_stats (player_id, season)
  values (new.id, extract(year from now())::int);
  return new;
end;
$$;

drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_profile();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table profiles enable row level security;
alter table rounds enable row level security;
alter table presence enable row level security;
alter table matches enable row level security;
alter table teams enable row level security;
alter table team_players enable row level security;
alter table goals enable row level security;
alter table player_stats enable row level security;
alter table achievements enable row level security;
alter table player_achievements enable row level security;
alter table notifications enable row level security;

-- Profiles: leitura pública, escrita próprio user ou admin
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (
  auth.uid() = id or
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Rounds: leitura pública, escrita admin
create policy "rounds_select" on rounds for select using (true);
create policy "rounds_insert" on rounds for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "rounds_update" on rounds for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "rounds_delete" on rounds for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Presence: leitura pública, escrita próprio user
create policy "presence_select" on presence for select using (true);
create policy "presence_insert" on presence for insert with check (auth.uid() = player_id);
create policy "presence_update" on presence for update using (auth.uid() = player_id);

-- Matches: leitura pública, escrita admin
create policy "matches_select" on matches for select using (true);
create policy "matches_insert" on matches for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "matches_update" on matches for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "matches_delete" on matches for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Teams: leitura pública, escrita admin
create policy "teams_select" on teams for select using (true);
create policy "teams_insert" on teams for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "teams_update" on teams for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "teams_delete" on teams for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Team players: leitura pública, escrita admin
create policy "team_players_select" on team_players for select using (true);
create policy "team_players_insert" on team_players for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "team_players_delete" on team_players for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Goals: leitura pública, escrita admin
create policy "goals_select" on goals for select using (true);
create policy "goals_insert" on goals for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "goals_delete" on goals for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Player stats: leitura pública, update admin ou sistema
create policy "player_stats_select" on player_stats for select using (true);
create policy "player_stats_insert" on player_stats for insert with check (true);
create policy "player_stats_update" on player_stats for update using (true);

-- Achievements: leitura pública
create policy "achievements_select" on achievements for select using (true);

-- Player achievements: leitura pública, insert sistema
create policy "player_achievements_select" on player_achievements for select using (true);
create policy "player_achievements_insert" on player_achievements for insert with check (true);

-- Notifications: apenas próprio user
create policy "notifications_select" on notifications for select using (auth.uid() = user_id);
create policy "notifications_insert" on notifications for insert with check (true);
create policy "notifications_update" on notifications for update using (auth.uid() = user_id);

-- CONQUISTAS: rodar separado apos o schema principal
-- (ver conquistas-seed.sql)
