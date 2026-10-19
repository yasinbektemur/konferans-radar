create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  channel text not null default 'email' check (channel in ('email', 'telegram', 'both')),
  enabled boolean not null default true,
  enabled_days text[] not null default '{monday,tuesday,wednesday,thursday,friday,saturday,sunday}',
  telegram_chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sent_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conference_id text not null,
  notification_key text not null,
  sent_at timestamptz not null default now(),
  channel text not null,
  unique (user_id, conference_id, notification_key)
);

alter table public.notification_settings enable row level security;
alter table public.sent_notifications enable row level security;

create policy "Users own settings"
on public.notification_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users own delivery log"
on public.sent_notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create trigger notification_settings_updated_at
before update on public.notification_settings
for each row
execute function public.update_updated_at();
