create table if not exists public.race_change_events (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  sync_run_id uuid not null references public.race_sync_runs(id) on delete cascade,
  source_site text not null,
  source_race_id text not null,
  change_key text not null,
  change_type text not null check (change_type in ('important_update')),
  changed_fields text[] not null default '{}',
  summary jsonb not null default '{}'::jsonb,
  before_payload jsonb not null default '{}'::jsonb,
  after_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_race_change_events_race_change_key
on public.race_change_events (race_id, change_key);

create index if not exists idx_race_change_events_sync_run_created_at
on public.race_change_events (sync_run_id, created_at desc);

create index if not exists idx_race_change_events_race_created_at
on public.race_change_events (race_id, created_at desc);

alter table public.race_change_events enable row level security;

drop policy if exists race_change_events_select_staff on public.race_change_events;
create policy race_change_events_select_staff
on public.race_change_events for select
to authenticated
using (public.jwt_is_staff());

create table if not exists public.race_change_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.race_change_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid references public.user_notifications(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_race_change_notifications_event_user
on public.race_change_notifications (event_id, user_id);

create index if not exists idx_race_change_notifications_user_created_at
on public.race_change_notifications (user_id, created_at desc);

alter table public.race_change_notifications enable row level security;

drop policy if exists race_change_notifications_select_staff on public.race_change_notifications;
create policy race_change_notifications_select_staff
on public.race_change_notifications for select
to authenticated
using (public.jwt_is_staff());
