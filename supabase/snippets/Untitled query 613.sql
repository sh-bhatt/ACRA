select
  msg_id,
  read_ct,
  enqueued_at,
  vt,
  now() as database_now,
  vt <= now() as is_visible
from pgmq.q_review_analysis
order by msg_id;