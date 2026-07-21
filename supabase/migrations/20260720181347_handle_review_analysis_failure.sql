-- ============================================================
-- ACRA: Static-analysis failure and retry handling
-- ============================================================

create or replace function public.record_review_analysis_failure(
  target_review_id uuid,
  target_user_id uuid,
  target_message_id bigint,
  safe_error_message text,
  is_unrecoverable boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_status text;
  current_retry_count smallint;
  next_retry_count smallint;
  message_deleted boolean;
  normalized_error_message text;
begin
  normalized_error_message :=
    left(
      trim(
        coalesce(
          safe_error_message,
          ''
        )
      ),
      2000
    );

  if normalized_error_message = '' then
    normalized_error_message :=
      'Static analysis failed unexpectedly';
  end if;

  -- Confirm that the active queue message belongs to the
  -- supplied review and user before changing any state.

  if not exists (
    select 1
    from pgmq.q_review_analysis as queued_message
    where queued_message.msg_id = target_message_id
      and queued_message.message ->> 'version' = '1'
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
        'Queue message does not match the failed review';
  end if;

  -- Lock the review row so multiple workers cannot update
  -- its retry state concurrently.

  select
    review.status,
    review.retry_count
  into
    current_status,
    current_retry_count
  from public.reviews as review
  where review.id = target_review_id
    and review.user_id = target_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message =
        'Failed review could not be found';
  end if;

  if current_status not in (
    'queued',
    'static_analysis'
  ) then
    raise exception using
      errcode = 'P0001',
      message =
        'Review is not in a retryable processing state';
  end if;

  /*
   * retry_count represents retries already scheduled.
   *
   * Initial attempt fails:
   *   retry_count 0 -> 1
   *
   * Third retry fails:
   *   retry_count is already 3
   *   review becomes permanently failed
   */

  if (
    is_unrecoverable
    or current_retry_count >= 3
  ) then
    update public.reviews
    set
      status = 'failed',
      error_message =
        normalized_error_message,
      completed_at =
        coalesce(completed_at, now())
    where id = target_review_id
      and user_id = target_user_id;

    select pgmq.delete(
      'review_analysis',
      target_message_id
    )
    into message_deleted;

    if message_deleted is distinct from true then
      raise exception using
        errcode = 'P0001',
        message =
          'Unable to remove permanently failed queue message';
    end if;

    return jsonb_build_object(
      'action',
      'failed',
      'retryCount',
      current_retry_count,
      'status',
      'failed'
    );
  end if;

  next_retry_count :=
    current_retry_count + 1;

  update public.reviews
  set
    retry_count = next_retry_count,
    error_message =
      normalized_error_message
  where id = target_review_id
    and user_id = target_user_id;

  -- The queue message intentionally remains active.
  -- pgmq visibility timeout will make it available again.

  return jsonb_build_object(
    'action',
    'retry',
    'retryCount',
    next_retry_count,
    'status',
    current_status
  );
end;
$function$;


-- ============================================================
-- Permissions
-- ============================================================

revoke all
on function public.record_review_analysis_failure(
  uuid,
  uuid,
  bigint,
  text,
  boolean
)
from public;

revoke all
on function public.record_review_analysis_failure(
  uuid,
  uuid,
  bigint,
  text,
  boolean
)
from anon;

revoke all
on function public.record_review_analysis_failure(
  uuid,
  uuid,
  bigint,
  text,
  boolean
)
from authenticated;

grant execute
on function public.record_review_analysis_failure(
  uuid,
  uuid,
  bigint,
  text,
  boolean
)
to service_role;