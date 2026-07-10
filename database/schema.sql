-- PostgreSQL schema для production-версии Homelix.
-- Выполняйте миграции через отдельного пользователя БД и не выдавайте service-role ключ клиенту.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);

create table if not exists password_reset_tokens (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  address text
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  title text not null
);

create table if not exists apartments (
  id text primary key,
  project_id uuid references projects(id) on delete set null,
  building_id uuid references buildings(id) on delete set null,
  section_id uuid references sections(id) on delete set null,
  city text not null,
  title text not null,
  floor integer not null,
  rooms_count integer not null,
  total_area numeric(8, 2) not null,
  price bigint not null check (price >= 0),
  mortgage_payment bigint not null check (mortgage_payment >= 0),
  status text not null check (status in ('available', 'reserved', 'sold')),
  window_view text not null,
  ceiling_height numeric(4, 2) not null,
  finishing text not null,
  advantages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rooms (
  id text not null,
  apartment_id text not null references apartments(id) on delete cascade,
  type text not null,
  name text not null,
  area numeric(8, 2) not null,
  description text not null,
  furniture_tips jsonb not null default '[]'::jsonb,
  ai_hints jsonb not null default '[]'::jsonb,
  chat_prompts jsonb not null default '[]'::jsonb,
  polygon text not null,
  label_x integer not null,
  label_y integer not null,
  primary key (apartment_id, id)
);

create table if not exists favorites (
  user_id uuid not null references users(id) on delete cascade,
  apartment_id text not null references apartments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, apartment_id)
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  apartment_id text not null references apartments(id) on delete cascade,
  status text not null check (status in ('active', 'cancelled', 'expired', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_reservation_per_apartment
on reservations(apartment_id)
where status = 'active';

create table if not exists furniture_items (
  id text primary key,
  title text not null,
  category text not null,
  room text not null,
  price bigint not null check (price >= 0),
  old_price bigint,
  dimensions text not null,
  material text not null,
  color text not null,
  delivery text not null,
  description text not null,
  tags jsonb not null default '[]'::jsonb,
  image text
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  apartment_id text references apartments(id) on delete set null,
  name text,
  phone text,
  email text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  apartment_id text references apartments(id) on delete set null,
  room_id text,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
