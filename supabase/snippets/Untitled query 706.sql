update public.review_files
set storage_path = '4f5e9290-b09a-4dc9-83e4-bdf97d81378c/d8ce90db-c109-4ae8-aa80-8f3c7829beeb/7a7afb81-f089-45cf-a0b9-5edfa4b3ddf7.ts'
where review_id = 'd8ce90db-c109-4ae8-aa80-8f3c7829beeb'
returning
  id,
  original_name,
  storage_path;