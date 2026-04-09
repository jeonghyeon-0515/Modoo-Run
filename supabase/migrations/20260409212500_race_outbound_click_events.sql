create table if not exists public.race_outbound_click_events (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source_race_id text not null,
  target_kind text not null check (
    target_kind in (
      'apply',
      'source_detail',
      'homepage',
      'map',
      'calendar_google',
      'calendar_ics'
    )
  ),
  target_url text not null,
  source_path text not null,
  viewer_role text not null default 'anon',
  referer text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_race_outbound_click_events_race_created_at
on public.race_outbound_click_events (race_id, created_at desc);

create index if not exists idx_race_outbound_click_events_target_kind_created_at
on public.race_outbound_click_events (target_kind, created_at desc);

create index if not exists idx_race_outbound_click_events_user_id
on public.race_outbound_click_events (user_id);

alter table public.race_outbound_click_events enable row level security;

drop policy if exists race_outbound_click_events_select_staff on public.race_outbound_click_events;
create policy race_outbound_click_events_select_staff
on public.race_outbound_click_events for select
to authenticated
using (public.jwt_is_staff());
