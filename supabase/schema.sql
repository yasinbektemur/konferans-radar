create extension if not exists pgcrypto;

create table if not exists public.conferences (
  id text primary key,
  name text not null,
  acronym text,
  description text,
  start_date date,
  end_date date,
  city text,
  country text,
  mode text check (mode in ('onsite', 'online', 'hybrid')),
  topics text[] not null default '{}',
  deadlines jsonb not null default '{}',
  publication jsonb not null default '{}',
  fees jsonb not null default '{}',
  official_url text,
  source text,
  last_verified date,
  trust_level text check (trust_level in ('verified', 'unknown', 'suspicious')),
  trust_notes text,
  type text check (type in ('conference', 'workshop', 'grant', 'competition', 'fair')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.followed_conferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text not null references public.conferences(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, conference_id)
);

create table if not exists public.kanban_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text references public.conferences(id) on delete set null,
  title text not null,
  work_name text,
  status text not null check (status in ('Planlanıyor', 'Yazılıyor', 'Gönderildi', 'Kabul', 'Ret')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.participation_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text references public.conferences(id) on delete set null,
  conference_name text not null,
  attended_at date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_conferences_country on public.conferences(country);
create index if not exists idx_conferences_start_date on public.conferences(start_date);
create index if not exists idx_followed_conferences_user on public.followed_conferences(user_id);
create index if not exists idx_kanban_cards_user_status on public.kanban_cards(user_id, status);
create index if not exists idx_participation_notes_user on public.participation_notes(user_id);

alter table public.conferences enable row level security;
alter table public.followed_conferences enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.participation_notes enable row level security;

create policy "Conferences are readable by everyone"
on public.conferences
for select
using (true);

create policy "Everyone can see shared board cards"
on public.kanban_cards
for select
using (true);

create policy "Users can manage own followed conferences"
on public.followed_conferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own kanban cards"
on public.kanban_cards
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own participation notes"
on public.participation_notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conferences_updated_at
before update on public.conferences
for each row
execute function public.update_updated_at();
