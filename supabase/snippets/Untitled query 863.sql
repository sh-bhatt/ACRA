select
  msg_id,
  read_ct,
  vt,
  now() as database_now,
  vt <= now() as is_visible
from pgmq.q_review_analysis
where message ->> 'reviewId' = 'd8ce90db-c109-4ae8-aa80-8f3c7829beeb';