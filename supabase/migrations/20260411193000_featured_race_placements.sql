create table if not exists public.featured_race_placements (
  slot_key text primary key check (slot_key in ('featured_primary', 'featured_secondary')),
  race_id uuid not null references public.races(id) on delete cascade,
  eyebrow text not null default 'Featured Listing',
  summary text not null,
  is_active boolean not null default true,
  updated_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_featured_race_placements_active_updated_at
on public.featured_race_placements (is_active, updated_at desc);

create or replace trigger set_updated_at_featured_race_placements
before update on public.featured_race_placements
for each row execute function public.set_updated_at();

alter table public.featured_race_placements enable row level security;

drop policy if exists featured_race_placements_select_public on public.featured_race_placements;
create policy featured_race_placements_select_public
on public.featured_race_placements for select
to anon, authenticated
using (is_active = true or public.jwt_is_staff());

drop policy if exists featured_race_placements_insert_staff on public.featured_race_placements;
create policy featured_race_placements_insert_staff
on public.featured_race_placements for insert
to authenticated
with check (public.jwt_is_staff());

drop policy if exists featured_race_placements_update_staff on public.featured_race_placements;
create policy featured_race_placements_update_staff
on public.featured_race_placements for update
to authenticated
using (public.jwt_is_staff())
with check (public.jwt_is_staff());

drop policy if exists featured_race_placements_delete_staff on public.featured_race_placements;
create policy featured_race_placements_delete_staff
on public.featured_race_placements for delete
to authenticated
using (public.jwt_is_staff());
