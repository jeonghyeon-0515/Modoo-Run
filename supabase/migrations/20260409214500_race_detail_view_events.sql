create table if not exists public.race_detail_view_events (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source_race_id text not null,
  source_path text not null,
  viewer_role text not null default 'anon',
  referer text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_race_detail_view_events_race_created_at
on public.race_detail_view_events (race_id, created_at desc);

create index if not exists idx_race_detail_view_events_user_id
on public.race_detail_view_events (user_id);

alter table public.race_detail_view_events enable row level security;

drop policy if exists race_detail_view_events_select_staff on public.race_detail_view_events;
create policy race_detail_view_events_select_staff
on public.race_detail_view_events for select
to authenticated
using (public.jwt_is_staff());
