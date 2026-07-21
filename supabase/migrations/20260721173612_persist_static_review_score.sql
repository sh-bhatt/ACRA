-- ============================================================
-- ACRA: Persist deterministic static-review score atomically
-- ============================================================

alter table public.reviews
add column if not exists score_breakdown jsonb;

do $block$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_overall_score_range'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
    add constraint reviews_overall_score_range
    check (
      overall_score is null
      or overall_score between 0 and 100
    );
  end if;
end;
$block$;

do $block$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_score_breakdown_object'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
    add constraint reviews_score_breakdown_object
    check (
      score_breakdown is null
      or jsonb_typeof(score_breakdown) = 'object'
    );
  end if;
end;
$block$;


-- The old three-argument function must be removed so callers
-- cannot finalize a review without persisting its score.
drop function if exists
public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint
);


create function public.finalize_static_analysis_job(
  target_review_id uuid,
  target_user_id uuid,
  target_message_id bigint,
  target_overall_score integer,
  target_score_breakdown jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  message_archived boolean;
  breakdown_overall_score integer;
begin
  if
    target_overall_score < 0
    or target_overall_score > 100
  then
    raise exception using
      errcode = '22023',
      message =
        'target_overall_score must be between 0 and 100';
  end if;

  if jsonb_typeof(target_score_breakdown)
    is distinct from 'object'
  then
    raise exception using
      errcode = '22023',
      message =
        'target_score_breakdown must be a JSON object';
  end if;

  begin
    breakdown_overall_score :=
      (
        target_score_breakdown ->> 'overallScore'
      )::integer;
  exception
    when invalid_text_representation then
      raise exception using
        errcode = '22023',
        message =
          'target_score_breakdown contains an invalid overallScore';
  end;

  if breakdown_overall_score is null then
    raise exception using
      errcode = '22023',
      message =
        'target_score_breakdown is missing overallScore';
  end if;

  if
    breakdown_overall_score <>
    target_overall_score
  then
    raise exception using
      errcode = '22023',
      message =
        'Score breakdown does not match target_overall_score';
  end if;

  if
    target_score_breakdown ->> 'version'
    is distinct from '1'
  then
    raise exception using
      errcode = '22023',
      message =
        'Unsupported score-breakdown version';
  end if;

  if not exists (
    select 1
    from pgmq.q_review_analysis as queued_message
    where queued_message.msg_id =
      target_message_id
      and queued_message.message ->> 'version' =
        '1'
      and queued_message.message ->> 'jobType' =
        'static-analysis'
      and queued_message.message ->> 'reviewId' =
        target_review_id::text
      and queued_message.message ->> 'userId' =
        target_user_id::text
  ) then
    raise exception using
      errcode = 'P0001',
      message =
        'Queue message does not match the target review and user';
  end if;

  update public.reviews
  set
    status = 'completed',
    overall_score = target_overall_score,
    score_breakdown = target_score_breakdown,
    completed_at =
      coalesce(completed_at, now()),
    error_message = null
  where id = target_review_id
    and user_id = target_user_id
    and status = 'static_analysis';

  -- A completed review is accepted only when the stored score
  -- exactly matches this retry's deterministic result.
  if not found then
    if not exists (
      select 1
      from public.reviews as review
      where review.id = target_review_id
        and review.user_id =
          target_user_id
        and review.status = 'completed'
        and review.overall_score =
          target_overall_score
        and review.score_breakdown =
          target_score_breakdown
    ) then
      raise exception using
        errcode = 'P0001',
        message =
          'Review is not available for scored static-analysis finalization';
    end if;
  end if;

  select pgmq.archive(
    'review_analysis',
    target_message_id
  )
  into message_archived;

  if message_archived is distinct from true then
    raise exception using
      errcode = 'P0001',
      message =
        'Unable to archive the completed queue message';
  end if;

  return true;
end;
$function$;


revoke all
on function public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint,
  integer,
  jsonb
)
from public, anon, authenticated;

grant execute
on function public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint,
  integer,
  jsonb
)
to service_role;