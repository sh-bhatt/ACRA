select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname ilike '%submitted source%'
    or policyname ilike '%draft reviews%'
  )
order by policyname;