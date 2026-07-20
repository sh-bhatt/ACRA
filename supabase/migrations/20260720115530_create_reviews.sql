-- ============================================================
-- ACRA: Reviews and submitted source files
-- ============================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null
    check (
      char_length(name) between 1 and 100
    ),

  input_type text not null
    check (
      input_type in ('paste', 'upload')
    ),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'queued',
        'static_analysis',
        'ai_analysis',
        'completed',
        'failed'
      )
    ),

  primary_language text not null
    check (
      primary_language in (
        'javascript',
        'jsx',
        'typescript',
        'tsx',
        'python'
      )
    ),

  review_focus text[] not null
    default array['full']::text[]
    check (
      cardinality(review_focus) between 1 and 6
      and review_focus <@ array[
        'full',
        'bugs',
        'security',
        'performance',
        'maintainability',
        'documentation'
      ]::text[]
    ),

  overall_score smallint
    check (
      overall_score is null
      or overall_score between 0 and 100
    ),

  summary text
    check (
      summary is null
      or char_length(summary) <= 10000
    ),

  file_count integer not null default 0
    check (
      file_count between 0 and 10
    ),

  total_lines integer not null default 0
    check (
      total_lines >= 0
    ),

  retry_count smallint not null default 0
    check (
      retry_count between 0 and 3
    ),

  model_name text,

  input_tokens integer
    check (
      input_tokens is null
      or input_tokens >= 0
    ),

  output_tokens integer
    check (
      output_tokens is null
      or output_tokens >= 0
    ),

  error_message text
    check (
      error_message is null
      or char_length(error_message) <= 2000
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);


create table public.review_files (
  id uuid primary key default gen_random_uuid(),

  review_id uuid not null
    references public.reviews(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  original_name text not null
    check (
      char_length(original_name) between 1 and 255
    ),

  storage_path text not null unique
    check (
      char_length(storage_path) between 1 and 1000
    ),

  language text not null
    check (
      language in (
        'javascript',
        'jsx',
        'typescript',
        'tsx',
        'python'
      )
    ),

  size_bytes integer not null
    check (
      size_bytes between 1 and 200000
    ),

  line_count integer not null
    check (
      line_count >= 1
    ),

  code_hash text not null
    check (
      char_length(code_hash) = 64
    ),

  created_at timestamptz not null default now()
);


-- ============================================================
-- Indexes
-- ============================================================

create index reviews_user_created_at_idx
  on public.reviews (
    user_id,
    created_at desc
  );

create index reviews_user_status_idx
  on public.reviews (
    user_id,
    status
  );

create index review_files_review_id_idx
  on public.review_files (
    review_id
  );

create index review_files_user_id_idx
  on public.review_files (
    user_id
  );


-- ============================================================
-- Automatically update reviews.updated_at
-- ============================================================

create or replace function public.set_review_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_review_updated_at();


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.reviews
enable row level security;

alter table public.review_files
enable row level security;


revoke all
on table public.reviews
from anon, authenticated;

revoke all
on table public.review_files
from anon, authenticated;


-- Users may create drafts using only user-controlled columns.
-- Processing state, scores and AI metadata remain server-controlled.

grant select, delete
on table public.reviews
to authenticated;

grant insert (
  user_id,
  name,
  input_type,
  primary_language,
  review_focus
)
on table public.reviews
to authenticated;


grant select, delete
on table public.review_files
to authenticated;

grant insert (
  review_id,
  user_id,
  original_name,
  storage_path,
  language,
  size_bytes,
  line_count,
  code_hash
)
on table public.review_files
to authenticated;


grant all
on table public.reviews
to service_role;

grant all
on table public.review_files
to service_role;


-- ============================================================
-- Review policies
-- ============================================================

create policy "Users can create their own review drafts"
on public.reviews
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and status = 'draft'
);


create policy "Users can view their own reviews"
on public.reviews
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


create policy "Users can delete their own reviews"
on public.reviews
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


-- ============================================================
-- Review-file policies
-- ============================================================

create policy "Users can add files to their own draft reviews"
on public.review_files
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.reviews
    where reviews.id = review_id
      and reviews.user_id = (select auth.uid())
      and reviews.status = 'draft'
  )
);


create policy "Users can view files from their own reviews"
on public.review_files
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


create policy "Users can delete files from their own reviews"
on public.review_files
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


-- ============================================================
-- Private Storage bucket for submitted source code
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'review-source-files',
  'review-source-files',
  false,
  200000,
  array[
    'text/plain'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- Expected object path:
-- <user-id>/<review-id>/<generated-file-name>


create policy "Users can upload files to their own draft reviews"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'review-source-files'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
  and exists (
    select 1
    from public.reviews
    where reviews.id::text =
      (storage.foldername(name))[2]
      and reviews.user_id =
        (select auth.uid())
      and reviews.status = 'draft'
  )
);


create policy "Users can read their own submitted source files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'review-source-files'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);


create policy "Users can delete their own submitted source files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'review-source-files'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);