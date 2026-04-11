create table if not exists public.partner_lead_guard_events (
  id uuid primary key default gen_random_uuid(),
  guard_type text not null default 'rate_limit' check (guard_type in ('rate_limit')),
  blocked_scope text not null check (blocked_scope in ('ip', 'email')),
  retry_after_seconds integer not null check (retry_after_seconds >= 0),
  source_path text,
  email_hash text not null,
  ip_hash text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_partner_lead_guard_events_created_at
on public.partner_lead_guard_events (created_at desc);

create index if not exists idx_partner_lead_guard_events_scope_created_at
on public.partner_lead_guard_events (blocked_scope, created_at desc);

alter table public.partner_lead_guard_events enable row level security;

drop policy if exists partner_lead_guard_events_select_staff on public.partner_lead_guard_events;
create policy partner_lead_guard_events_select_staff
on public.partner_lead_guard_events for select
to authenticated
using (public.jwt_is_staff());
