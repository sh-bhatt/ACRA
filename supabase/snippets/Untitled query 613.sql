select
  review.id,
  review.name,
  review.status,
  review.completed_at,
  review.error_message,
  count(finding.id)::integer as finding_count
from public.reviews as review
left join public.findings as finding
  on finding.review_id = review.id
where review.id = '286f271e-dadf-4b4d-968c-2483bb047a2f'
group by
  review.id,
  review.name,
  review.status,
  review.completed_at,
  review.error_message;