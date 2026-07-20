select
  id,
  status,
  completed_at,
  error_message
from public.reviews
where id = 'b65cc08d-749a-4587-af2e-1db1733eb487';

select
  count(*) as finding_count
from public.findings
where review_id = 'b65cc08d-749a-4587-af2e-1db1733eb487';