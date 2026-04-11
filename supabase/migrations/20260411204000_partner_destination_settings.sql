create table if not exists public.partner_destination_settings (
  destination_key text primary key check (destination_key in ('garmin', 'nike', 'decathlon')),
  destination_url text not null,
  updated_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace trigger set_updated_at_partner_destination_settings
before update on public.partner_destination_settings
for each row execute function public.set_updated_at();

alter table public.partner_destination_settings enable row level security;

drop policy if exists partner_destination_settings_select_public on public.partner_destination_settings;
create policy partner_destination_settings_select_public
on public.partner_destination_settings for select
to anon, authenticated
using (true);

drop policy if exists partner_destination_settings_insert_staff on public.partner_destination_settings;
create policy partner_destination_settings_insert_staff
on public.partner_destination_settings for insert
to authenticated
with check (public.jwt_is_staff());

drop policy if exists partner_destination_settings_update_staff on public.partner_destination_settings;
create policy partner_destination_settings_update_staff
on public.partner_destination_settings for update
to authenticated
using (public.jwt_is_staff())
with check (public.jwt_is_staff());

drop policy if exists partner_destination_settings_delete_staff on public.partner_destination_settings;
create policy partner_destination_settings_delete_staff
on public.partner_destination_settings for delete
to authenticated
using (public.jwt_is_staff());
