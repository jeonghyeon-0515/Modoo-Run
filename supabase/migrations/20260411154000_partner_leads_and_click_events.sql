create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization_name text not null,
  inquiry_type text not null check (inquiry_type in ('featured_listing', 'sponsorship', 'affiliate', 'other')),
  message text not null,
  source_path text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  admin_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.partner_click_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  target_kind text not null check (target_kind in ('partner_inquiry', 'affiliate', 'sponsored')),
  target_url text not null,
  source_path text not null,
  viewer_role text not null default 'anon',
  referer text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_partner_leads_created_at on public.partner_leads (created_at desc);
create index if not exists idx_partner_leads_inquiry_type_created_at on public.partner_leads (inquiry_type, created_at desc);
create index if not exists idx_partner_click_events_kind_created_at on public.partner_click_events (target_kind, created_at desc);
create index if not exists idx_partner_click_events_source_path_created_at on public.partner_click_events (source_path, created_at desc);

create or replace trigger set_updated_at_partner_leads
before update on public.partner_leads
for each row execute function public.set_updated_at();

alter table public.partner_leads enable row level security;
alter table public.partner_click_events enable row level security;

drop policy if exists partner_leads_select_staff on public.partner_leads;
create policy partner_leads_select_staff
on public.partner_leads for select
to authenticated
using (public.jwt_is_staff());

drop policy if exists partner_leads_update_staff on public.partner_leads;
create policy partner_leads_update_staff
on public.partner_leads for update
to authenticated
using (public.jwt_is_staff())
with check (public.jwt_is_staff());

drop policy if exists partner_click_events_select_staff on public.partner_click_events;
create policy partner_click_events_select_staff
on public.partner_click_events for select
to authenticated
using (public.jwt_is_staff());
