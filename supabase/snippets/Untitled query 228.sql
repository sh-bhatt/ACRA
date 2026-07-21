select
  r.id as review_id,
  r.user_id,
  r.status,
  r.retry_count,
  rf.id as file_id,
  rf.original_name
from
  public.reviews as r
  inner join public.review_files as rf on rf.review_id = r.id
where
  r.id = '5db66e08-a19e-4d55-9110-0976cffae074';