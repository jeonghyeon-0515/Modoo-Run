create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user');
$$;

create or replace function public.jwt_is_staff()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('admin', 'moderator');
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '러너'
    )
  )
  on conflict (id) do update
    set display_name = coalesce(public.profiles.display_name, excluded.display_name),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_profile();

create or replace function public.sync_community_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.community_posts
       set comment_count = (
         select count(*)
         from public.community_comments
         where post_id = old.post_id
           and status = 'published'
       )
     where id = old.post_id;
    return old;
  end if;

  update public.community_posts
     set comment_count = (
       select count(*)
       from public.community_comments
       where post_id = new.post_id
         and status = 'published'
     )
   where id = new.post_id;

  if tg_op = 'UPDATE' and old.post_id is distinct from new.post_id then
    update public.community_posts
       set comment_count = (
         select count(*)
         from public.community_comments
         where post_id = old.post_id
           and status = 'published'
       )
     where id = old.post_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_community_post_comment_count on public.community_comments;
create trigger sync_community_post_comment_count
after insert or update or delete on public.community_comments
for each row execute function public.sync_community_post_comment_count();

create or replace function public.sync_community_post_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.post_id is not null then
      update public.community_posts
         set report_count = (
           select count(*)
           from public.community_reports
           where post_id = old.post_id
         )
       where id = old.post_id;
    end if;
    return old;
  end if;

  if new.post_id is not null then
    update public.community_posts
       set report_count = (
         select count(*)
         from public.community_reports
         where post_id = new.post_id
       )
     where id = new.post_id;
  end if;

  if tg_op = 'UPDATE' and old.post_id is distinct from new.post_id and old.post_id is not null then
    update public.community_posts
       set report_count = (
         select count(*)
         from public.community_reports
         where post_id = old.post_id
       )
     where id = old.post_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_community_post_report_count on public.community_reports;
create trigger sync_community_post_report_count
after insert or update or delete on public.community_reports
for each row execute function public.sync_community_post_report_count();

alter table public.profiles enable row level security;
alter table public.races enable row level security;
alter table public.race_bookmarks enable row level security;
alter table public.monthly_plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.plan_item_logs enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.notification_rules enable row level security;
alter table public.race_sync_runs enable row level security;
alter table public.race_sources enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists races_public_read on public.races;
create policy races_public_read
on public.races for select
to anon, authenticated
using (true);

drop policy if exists race_bookmarks_select_own on public.race_bookmarks;
create policy race_bookmarks_select_own
on public.race_bookmarks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists race_bookmarks_insert_own on public.race_bookmarks;
create policy race_bookmarks_insert_own
on public.race_bookmarks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists race_bookmarks_update_own on public.race_bookmarks;
create policy race_bookmarks_update_own
on public.race_bookmarks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists race_bookmarks_delete_own on public.race_bookmarks;
create policy race_bookmarks_delete_own
on public.race_bookmarks for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists monthly_plans_select_own on public.monthly_plans;
create policy monthly_plans_select_own
on public.monthly_plans for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists monthly_plans_insert_own on public.monthly_plans;
create policy monthly_plans_insert_own
on public.monthly_plans for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists monthly_plans_update_own on public.monthly_plans;
create policy monthly_plans_update_own
on public.monthly_plans for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists monthly_plans_delete_own on public.monthly_plans;
create policy monthly_plans_delete_own
on public.monthly_plans for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists plan_items_select_owner on public.plan_items;
create policy plan_items_select_owner
on public.plan_items for select
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = plan_items.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists plan_items_insert_owner on public.plan_items;
create policy plan_items_insert_owner
on public.plan_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = plan_items.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists plan_items_update_owner on public.plan_items;
create policy plan_items_update_owner
on public.plan_items for update
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = plan_items.plan_id
      and monthly_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = plan_items.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists plan_items_delete_owner on public.plan_items;
create policy plan_items_delete_owner
on public.plan_items for delete
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = plan_items.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists plan_item_logs_select_own on public.plan_item_logs;
create policy plan_item_logs_select_own
on public.plan_item_logs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists plan_item_logs_insert_own on public.plan_item_logs;
create policy plan_item_logs_insert_own
on public.plan_item_logs for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.plan_items
    join public.monthly_plans on monthly_plans.id = plan_items.plan_id
    where plan_items.id = plan_item_logs.plan_item_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists community_posts_select_public_or_staff on public.community_posts;
create policy community_posts_select_public_or_staff
on public.community_posts for select
to anon, authenticated
using (
  status = 'published'
  or author_user_id = auth.uid()
  or public.jwt_is_staff()
);

drop policy if exists community_posts_insert_own on public.community_posts;
create policy community_posts_insert_own
on public.community_posts for insert
to authenticated
with check (
  auth.uid() = author_user_id
  and status = 'published'
);

drop policy if exists community_posts_update_author on public.community_posts;
create policy community_posts_update_author
on public.community_posts for update
to authenticated
using (auth.uid() = author_user_id)
with check (
  auth.uid() = author_user_id
  and status = 'published'
);

drop policy if exists community_posts_update_staff on public.community_posts;
create policy community_posts_update_staff
on public.community_posts for update
to authenticated
using (public.jwt_is_staff())
with check (true);

drop policy if exists community_posts_delete_author on public.community_posts;
create policy community_posts_delete_author
on public.community_posts for delete
to authenticated
using (auth.uid() = author_user_id or public.jwt_is_staff());

drop policy if exists community_comments_select_public_or_staff on public.community_comments;
create policy community_comments_select_public_or_staff
on public.community_comments for select
to anon, authenticated
using (
  status = 'published'
  or author_user_id = auth.uid()
  or public.jwt_is_staff()
);

drop policy if exists community_comments_insert_own on public.community_comments;
create policy community_comments_insert_own
on public.community_comments for insert
to authenticated
with check (
  auth.uid() = author_user_id
  and status = 'published'
);

drop policy if exists community_comments_update_author on public.community_comments;
create policy community_comments_update_author
on public.community_comments for update
to authenticated
using (auth.uid() = author_user_id)
with check (
  auth.uid() = author_user_id
  and status = 'published'
);

drop policy if exists community_comments_update_staff on public.community_comments;
create policy community_comments_update_staff
on public.community_comments for update
to authenticated
using (public.jwt_is_staff())
with check (true);

drop policy if exists community_comments_delete_author on public.community_comments;
create policy community_comments_delete_author
on public.community_comments for delete
to authenticated
using (auth.uid() = author_user_id or public.jwt_is_staff());

drop policy if exists community_reports_select_staff on public.community_reports;
create policy community_reports_select_staff
on public.community_reports for select
to authenticated
using (public.jwt_is_staff());

drop policy if exists community_reports_insert_own on public.community_reports;
create policy community_reports_insert_own
on public.community_reports for insert
to authenticated
with check (auth.uid() = reporter_user_id);

drop policy if exists community_reports_update_staff on public.community_reports;
create policy community_reports_update_staff
on public.community_reports for update
to authenticated
using (public.jwt_is_staff())
with check (public.jwt_is_staff());

drop policy if exists admin_audit_logs_select_staff on public.admin_audit_logs;
create policy admin_audit_logs_select_staff
on public.admin_audit_logs for select
to authenticated
using (public.jwt_is_staff());

drop policy if exists admin_audit_logs_insert_staff on public.admin_audit_logs;
create policy admin_audit_logs_insert_staff
on public.admin_audit_logs for insert
to authenticated
with check (public.jwt_is_staff());

drop policy if exists notification_rules_select_own on public.notification_rules;
create policy notification_rules_select_own
on public.notification_rules for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists notification_rules_insert_own on public.notification_rules;
create policy notification_rules_insert_own
on public.notification_rules for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists notification_rules_update_own on public.notification_rules;
create policy notification_rules_update_own
on public.notification_rules for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists notification_rules_delete_own on public.notification_rules;
create policy notification_rules_delete_own
on public.notification_rules for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists race_sync_runs_select_staff on public.race_sync_runs;
create policy race_sync_runs_select_staff
on public.race_sync_runs for select
to authenticated
using (public.jwt_is_staff());

drop policy if exists race_sources_select_staff on public.race_sources;
create policy race_sources_select_staff
on public.race_sources for select
to authenticated
using (public.jwt_is_staff());
