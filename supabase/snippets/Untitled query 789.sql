select
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname ilike '%submitted source%'
order by policyname;