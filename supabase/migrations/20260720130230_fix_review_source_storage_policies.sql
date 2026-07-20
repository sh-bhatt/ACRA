-- ============================================================
-- ACRA: Fix private review-source Storage policies
-- ============================================================

create or replace function public.user_owns_draft_review(
  target_review_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reviews as review
    where review.id::text = target_review_id
      and review.user_id = (select auth.uid())
      and review.status = 'draft'
  );
$$;

revoke all
on function public.user_owns_draft_review(text)
from public, anon;

grant execute
on function public.user_owns_draft_review(text)
to authenticated, service_role;


-- Remove the previous versions.

drop policy if exists
  "Users can upload files to their own draft reviews"
on storage.objects;

drop policy if exists
  "Users can read their own submitted source files"
on storage.objects;

drop policy if exists
  "Users can delete their own submitted source files"
on storage.objects;


-- Upload only under:
-- <user-id>/<owned-draft-review-id>/<file-name>

create policy
  "Users can upload files to their own draft reviews"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'review-source-files'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
  and public.user_owns_draft_review(
    (storage.foldername(name))[2]
  )
);


-- Required because Storage returns the inserted
-- object metadata after a successful upload.

create policy
  "Users can read their own submitted source files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'review-source-files'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);


create policy
  "Users can delete their own submitted source files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'review-source-files'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);