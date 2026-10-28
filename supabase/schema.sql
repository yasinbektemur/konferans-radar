create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists public.conferences (
  id text primary key,
  ad text not null,
  kisaltma text,
  aciklama text,
  baslangic_tarihi date,
  bitis_tarihi date,
  sehir text,
  ulke text,
  mod text not null default 'onsite' check (mod in ('onsite', 'online', 'hybrid')),
  konular text[] not null default '{}',
  ozet_son_tarih date,
  tam_metin_son_tarih date,
  kabul_bildirimi date,
  kamera_hazir date,
  kayit_son_tarih date,
  yayinci text,
  indeksler text[] not null default '{}',
  ucret numeric(12,2),
  para_birimi text,
  ogrenci_indirimi boolean not null default false,
  burs boolean not null default false,
  resmi_link text,
  kaynak text,
  son_dogrulama date,
  guven text not null default 'unknown' check (guven in ('verified', 'unknown', 'suspicious')),
  guven_notu text,
  tur text not null default 'conference' check (tur in ('conference', 'workshop', 'grant', 'competition', 'fair')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pending_conferences (
  id text primary key,
  ad text not null,
  kisaltma text,
  aciklama text,
  baslangic_tarihi date,
  bitis_tarihi date,
  sehir text,
  ulke text,
  mod text not null default 'onsite' check (mod in ('onsite', 'online', 'hybrid')),
  konular text[] not null default '{}',
  ozet_son_tarih date,
  tam_metin_son_tarih date,
  kabul_bildirimi date,
  kamera_hazir date,
  kayit_son_tarih date,
  yayinci text,
  indeksler text[] not null default '{}',
  ucret numeric(12,2),
  para_birimi text,
  ogrenci_indirimi boolean not null default false,
  burs boolean not null default false,
  resmi_link text,
  kaynak text,
  son_dogrulama date,
  guven text not null default 'unknown' check (guven in ('verified', 'unknown', 'suspicious')),
  guven_notu text,
  tur text not null default 'conference' check (tur in ('conference', 'workshop', 'grant', 'competition', 'fair')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text not null references public.conferences(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, conference_id)
);

create table if not exists public.kanban_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text references public.conferences(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text references public.conferences(id) on delete set null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conferences_ulke on public.conferences(ulke);
create index if not exists idx_conferences_baslangic_tarihi on public.conferences(baslangic_tarihi);
create index if not exists idx_pending_conferences_status on public.pending_conferences(status);
create index if not exists idx_follows_user_id on public.follows(user_id);
create index if not exists idx_kanban_cards_user_id on public.kanban_cards(user_id, status);
create index if not exists idx_notes_user_id on public.notes(user_id);

alter table public.conferences enable row level security;
alter table public.pending_conferences enable row level security;
alter table public.follows enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.notes enable row level security;

create policy "Conferences are readable by everyone"
on public.conferences
for select
using (true);

create policy "Admins can manage conferences"
on public.conferences
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage pending conferences"
on public.pending_conferences
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users can manage their own follows"
on public.follows
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own kanban cards"
on public.kanban_cards
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own notes"
on public.notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conferences_updated_at
before update on public.conferences
for each row
execute function public.set_updated_at();

create trigger pending_conferences_updated_at
before update on public.pending_conferences
for each row
execute function public.set_updated_at();

create trigger kanban_cards_updated_at
before update on public.kanban_cards
for each row
execute function public.set_updated_at();

create trigger notes_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();
