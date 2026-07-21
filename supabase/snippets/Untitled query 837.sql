select
  review.id,
  review.status,
  review.retry_count,
  review.error_message,
  review.completed_at,
  count(finding.id)::integer as finding_count
from public.reviews as review
left join public.findings as finding
  on finding.review_id = review.id
where review.id = 'd8ce90db-c109-4ae8-aa80-8f3c7829beeb'
group by
  review.id,
  review.status,
  review.retry_count,
  review.error_message,
  review.completed_at;