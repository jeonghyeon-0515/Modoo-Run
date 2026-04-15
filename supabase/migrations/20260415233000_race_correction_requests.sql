create table if not exists public.race_correction_requests (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  source_race_id text not null,
  requester_name text not null,
  requester_email text not null,
  requester_role text not null check (requester_role in ('runner', 'organizer', 'volunteer', 'other')),
  field_kind text not null check (field_kind in ('date', 'registration', 'location', 'course', 'contact', 'homepage', 'other')),
  current_value text,
  suggested_value text not null,
  message text,
  source_path text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'rejected')),
  admin_note text,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_race_correction_requests_status_created_at
on public.race_correction_requests (status, created_at desc);

create index if not exists idx_race_correction_requests_race_created_at
on public.race_correction_requests (race_id, created_at desc);

create or replace trigger set_updated_at_race_correction_requests
before update on public.race_correction_requests
for each row execute function public.set_updated_at();

alter table public.race_correction_requests enable row level security;

drop policy if exists race_correction_requests_select_staff on public.race_correction_requests;
create policy race_correction_requests_select_staff
on public.race_correction_requests for select
to authenticated
using (public.jwt_is_staff());

drop policy if exists race_correction_requests_update_staff on public.race_correction_requests;
create policy race_correction_requests_update_staff
on public.race_correction_requests for update
to authenticated
using (public.jwt_is_staff())
with check (public.jwt_is_staff());
