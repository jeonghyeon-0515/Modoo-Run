alter table public.profiles
  rename column home_region to preferred_regions;

alter table public.profiles
  alter column preferred_regions type text[]
  using case
    when preferred_regions is null or btrim(preferred_regions) = '' then '{}'::text[]
    else array[btrim(preferred_regions)]
  end,
  alter column preferred_regions set default '{}'::text[];

update public.profiles
set preferred_regions = '{}'::text[]
where preferred_regions is null;

alter table public.profiles
  alter column preferred_regions set not null;

alter table public.profiles
  rename column preferred_distance to preferred_distances;

alter table public.profiles
  alter column preferred_distances type text[]
  using case
    when preferred_distances is null or btrim(preferred_distances) = '' then '{}'::text[]
    else array[btrim(preferred_distances)]
  end,
  alter column preferred_distances set default '{}'::text[];

update public.profiles
set preferred_distances = '{}'::text[]
where preferred_distances is null;

alter table public.profiles
  alter column preferred_distances set not null;
