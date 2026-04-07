create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  source_site text not null,
  source_race_id text not null,
  title text not null,
  event_date date,
  event_date_label text,
  weekday_label text,
  start_at timestamptz,
  region text,
  location text,
  course_summary text,
  organizer text,
  representative_name text,
  phone text,
  homepage_url text,
  registration_open_at date,
  registration_close_at date,
  registration_period_label text,
  registration_status text not null default 'open' check (registration_status in ('open', 'closed', 'unknown')),
  summary text,
  description text,
  source_list_url text,
  source_detail_url text not null,
  source_hash text,
  parser_version text not null default 'v1',
  last_synced_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_changed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint races_source_unique unique (source_site, source_race_id)
);

create table if not exists public.race_sources (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  source_site text not null,
  source_race_id text not null,
  source_list_url text,
  source_detail_url text not null,
  source_payload jsonb not null default '{}'::jsonb,
  parser_version text not null default 'v1',
  content_hash text,
  status text not null default 'active' check (status in ('active', 'missing', 'parse_failed', 'disabled')),
  fetched_at timestamptz not null default timezone('utc', now()),
  disabled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint race_sources_source_unique unique (source_site, source_race_id)
);

create table if not exists public.race_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_site text not null,
  trigger_type text not null default 'cron' check (trigger_type in ('cron', 'manual', 'backfill')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  parsed_count integer not null default 0,
  upserted_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  warning_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  home_region text,
  preferred_distance text,
  goal_race_id uuid references public.races(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  month smallint not null check (month between 1 and 12),
  title text,
  notes text,
  target_race_id uuid references public.races(id) on delete set null,
  goal_distance_km numeric(6,2),
  goal_sessions integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint monthly_plans_user_month_unique unique (user_id, year, month)
);

create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.monthly_plans(id) on delete cascade,
  scheduled_date date not null,
  category text not null default 'custom' check (category in ('easy_run', 'tempo', 'interval', 'long_run', 'recovery', 'race', 'rest', 'cross_training', 'custom')),
  title text not null,
  description text,
  target_distance_km numeric(6,2),
  target_duration_minutes integer,
  target_pace_seconds integer,
  linked_race_id uuid references public.races(id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'completed', 'partial', 'skipped')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plan_item_logs (
  id uuid primary key default gen_random_uuid(),
  plan_item_id uuid not null references public.plan_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('completed', 'partial', 'skipped')),
  actual_distance_km numeric(6,2),
  actual_duration_minutes integer,
  actual_pace_seconds integer,
  memo text,
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.race_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  race_id uuid not null references public.races(id) on delete cascade,
  notify_registration_deadline boolean not null default true,
  notify_one_week_before boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint race_bookmarks_user_race_unique unique (user_id, race_id)
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  linked_race_id uuid references public.races(id) on delete set null,
  category text not null check (category in ('free', 'training', 'review')),
  title text not null,
  content text not null,
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.community_comments(id) on delete cascade,
  content text not null,
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint community_reports_target_check check (num_nonnulls(post_id, comment_id) = 1)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_table text not null,
  target_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_type text not null check (rule_type in ('registration_deadline', 'race_reminder', 'plan_reminder', 'weekly_summary')),
  enabled boolean not null default true,
  target_race_id uuid references public.races(id) on delete cascade,
  target_plan_id uuid references public.monthly_plans(id) on delete cascade,
  lead_days integer,
  schedule_label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_races_status_event_date on public.races (registration_status, event_date);
create index if not exists idx_races_region on public.races (region);
create index if not exists idx_races_last_synced_at on public.races (last_synced_at desc);
create index if not exists idx_race_sources_race_id on public.race_sources (race_id);
create index if not exists idx_race_sync_runs_status_started_at on public.race_sync_runs (status, started_at desc);
create index if not exists idx_monthly_plans_user_id on public.monthly_plans (user_id);
create index if not exists idx_plan_items_plan_date on public.plan_items (plan_id, scheduled_date);
create index if not exists idx_plan_item_logs_plan_item_completed_at on public.plan_item_logs (plan_item_id, completed_at desc);
create index if not exists idx_race_bookmarks_user_id on public.race_bookmarks (user_id);
create index if not exists idx_community_posts_category_status_created_at on public.community_posts (category, status, created_at desc);
create index if not exists idx_community_posts_linked_race_id on public.community_posts (linked_race_id);
create index if not exists idx_community_comments_post_created_at on public.community_comments (post_id, created_at asc);
create index if not exists idx_community_reports_status_created_at on public.community_reports (status, created_at asc);
create index if not exists idx_notification_rules_user_enabled on public.notification_rules (user_id, enabled);

create or replace trigger set_updated_at_races
before update on public.races
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_race_sources
before update on public.race_sources
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_monthly_plans
before update on public.monthly_plans
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_plan_items
before update on public.plan_items
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_community_posts
before update on public.community_posts
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_community_comments
before update on public.community_comments
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_notification_rules
before update on public.notification_rules
for each row execute function public.set_updated_at();
