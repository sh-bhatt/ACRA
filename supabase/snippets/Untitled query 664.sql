update public.review_files
set code_hash =
  '0000000000000000000000000000000000000000000000000000000000000000'
where review_id = '1160fa66-fff1-4a44-9c40-6b97e91423c1'
returning
  id,
  original_name,
  code_hash;