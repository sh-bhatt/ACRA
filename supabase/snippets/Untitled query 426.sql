select
  id,
  status,
  completed_at
from public.reviews
where id = 'b65cc08d-749a-4587-af2e-1db1733eb487';


select count(*) as finding_count
from public.findings
where review_id = 'b65cc08d-749a-4587-af2e-1db1733eb487';


select *
from pgmq.q_review_analysis
where msg_id = 1;


select
  msg_id,
  read_ct,
  archived_at
from pgmq.a_review_analysis
where msg_id = 1;