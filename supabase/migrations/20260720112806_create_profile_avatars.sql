-- ============================================================
-- ACRA: Profile avatar storage
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- Storage RLS policies
-- Object paths must be:
-- <authenticated-user-id>/<generated-file-name>
-- ============================================================

create policy "Users can upload their own profile avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);


-- SELECT is needed by the Storage API when deleting files.

create policy "Users can inspect their own profile avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);


create policy "Users can delete their own profile avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] =
    (select auth.uid())::text
);