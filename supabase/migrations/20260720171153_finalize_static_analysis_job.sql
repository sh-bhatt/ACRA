-- ============================================================
-- ACRA: Atomically complete static analysis and archive its job
-- ============================================================

create or replace function public.finalize_static_analysis_job(
  target_review_id uuid,
  target_user_id uuid,
  target_message_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  message_archived boolean;
begin
  -- Ensure the supplied queue message belongs to the same
  -- review and user that the worker is finalizing.

  if not exists (
    select 1
    from pgmq.q_review_analysis as queued_message
    where queued_message.msg_id = target_message_id
      and queued_message.message ->> 'version' = '1'
      and queued_message.message ->> 'jobType' = 'static-analysis'
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
    completed_at = coalesce(completed_at, now()),
    error_message = null
  where id = target_review_id
    and user_id = target_user_id
    and status = 'static_analysis';

  -- A completed review is accepted for safe idempotency.
  -- Any other state indicates an invalid lifecycle transition.

  if not found then
    if not exists (
      select 1
      from public.reviews as review
      where review.id = target_review_id
        and review.user_id = target_user_id
        and review.status = 'completed'
    ) then
      raise exception using
        errcode = 'P0001',
        message =
          'Review is not available for static-analysis finalization';
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
      message = 'Unable to archive the completed queue message';
  end if;

  return true;
end;
$function$;


-- ============================================================
-- Permissions
-- ============================================================

revoke all
on function public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint
)
from public;

revoke all
on function public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint
)
from anon;

revoke all
on function public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint
)
from authenticated;

grant execute
on function public.finalize_static_analysis_job(
  uuid,
  uuid,
  bigint
)
to service_role;