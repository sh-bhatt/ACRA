select
  msg_id,
  read_ct,
  vt,
  now() as database_now,
  vt <= now() as is_visible
from pgmq.q_review_analysis
where message ->> 'reviewId' =
  '6b9ff32d-f0f4-4946-a9b8-fa39d02141f6';