-- ============================================================
-- ACRA: User profiles
-- ============================================================

create table public.profiles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id)
    on delete cascade,

  name text not null
    check (
      char_length(name) >= 1
      and char_length(name) <= 80
    ),

  avatar_url text
    check (
      avatar_url is null
      or char_length(avatar_url) <= 2048
    ),

  default_review_focus text[] not null
    default array['full']::text[]
    check (
      cardinality(default_review_focus) between 1 and 6
      and default_review_focus <@ array[
        'full',
        'bugs',
        'security',
        'performance',
        'maintainability',
        'documentation'
      ]::text[]
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- Indexes
-- ============================================================

create index profiles_user_id_idx
  on public.profiles using btree (user_id);


-- ============================================================
-- Automatically update updated_at
-- ============================================================

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();


-- ============================================================
-- Automatically create profile after Supabase Auth signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    user_id,
    name
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Developer'
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_user_signup
after insert on auth.users
for each row
execute function public.handle_new_user();


-- Prevent normal API roles from manually invoking
-- the privileged profile-creation function.

revoke execute
on function public.handle_new_user()
from public, anon, authenticated;


-- ============================================================
-- Backfill profiles for users created before this migration
-- ============================================================

insert into public.profiles (
  user_id,
  name
)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(users.email, '@', 1), ''),
    'Developer'
  )
from auth.users as users
on conflict (user_id) do nothing;


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles
enable row level security;


-- Remove broad/default privileges.

revoke all
on table public.profiles
from anon, authenticated;


-- Authenticated users only need to read and update
-- their own profile. Profile insertion is handled by the trigger.

grant select, update
on table public.profiles
to authenticated;


-- The worker may later use the Supabase secret key.

grant all
on table public.profiles
to service_role;


-- ============================================================
-- SELECT policy
-- ============================================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


-- ============================================================
-- UPDATE policy
-- ============================================================

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);