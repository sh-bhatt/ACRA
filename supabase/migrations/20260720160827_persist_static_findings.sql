-- ============================================================
-- ACRA: Atomically replace static findings for one review file
-- ============================================================

create or replace function public.replace_static_findings_for_file(
  target_review_id uuid,
  target_file_id uuid,
  target_user_id uuid,
  target_findings jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  inserted_count integer;
begin
  if jsonb_typeof(target_findings) is distinct from 'array' then
    raise exception using
      errcode = '22023',
      message = 'target_findings must be a JSON array';
  end if;

  -- Verify that the file, review and user belong together.
  -- Static findings may only be persisted while the review
  -- is in the static-analysis processing state.

  if not exists (
    select 1
    from public.review_files as review_file
    inner join public.reviews as review
      on review.id = review_file.review_id
      and review.user_id = review_file.user_id
    where review_file.id = target_file_id
      and review_file.review_id = target_review_id
      and review_file.user_id = target_user_id
      and review.status = 'static_analysis'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Review file is not available for static finding persistence';
  end if;

  -- Delete only static findings for this file.
  -- Future AI findings remain untouched.

  delete from public.findings
  where review_id = target_review_id
    and file_id = target_file_id
    and user_id = target_user_id
    and source = 'static';

  insert into public.findings (
    review_id,
    file_id,
    user_id,
    source,
    rule_id,
    category,
    severity,
    confidence,
    title,
    explanation,
    suggested_fix,
    replacement_code,
    line_start,
    line_end,
    fingerprint
  )
  select
    target_review_id,
    target_file_id,
    target_user_id,
    'static',
    finding.rule_id,
    finding.category,
    finding.severity,
    finding.confidence,
    finding.title,
    finding.explanation,
    finding.suggested_fix,
    finding.replacement_code,
    finding.line_start,
    finding.line_end,
    finding.fingerprint
  from jsonb_to_recordset(target_findings) as finding (
    rule_id text,
    category text,
    severity text,
    confidence double precision,
    title text,
    explanation text,
    suggested_fix text,
    replacement_code text,
    line_start integer,
    line_end integer,
    fingerprint text
  );

  get diagnostics inserted_count = row_count;

  return inserted_count;
end;
$function$;


-- ============================================================
-- Permissions
-- ============================================================

revoke all
on function public.replace_static_findings_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from public;

revoke all
on function public.replace_static_findings_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from anon;

revoke all
on function public.replace_static_findings_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from authenticated;

grant execute
on function public.replace_static_findings_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
to service_role;