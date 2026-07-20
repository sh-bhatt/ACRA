-- ============================================================
-- ACRA: Durable static-analysis queue
-- ============================================================

create extension if not exists pgmq;


-- Create the queue only when it does not already exist.

do $$
begin
  if not exists (
    select 1
    from pgmq.list_queues()
    where queue_name = 'review_analysis'
  ) then
    perform pgmq.create('review_analysis');
  end if;
end;
$$;


-- ============================================================
-- Authenticated operation:
-- Validate ownership, enforce quotas, mark queued and enqueue
-- everything inside one database transaction.
-- ============================================================

create or replace function public.enqueue_review_analysis(
  target_review_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  active_review_count integer;
  queued_review_count integer;
  completed_today_count integer;
  validated_review_id uuid;
  queue_message_id bigint;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Serialize quota checks for this user so parallel requests
  -- cannot bypass queue or concurrency limits.
  perform pg_advisory_xact_lock(
    hashtextextended(current_user_id::text, 0)
  );

  select count(*)
  into active_review_count
  from public.reviews
  where user_id = current_user_id
    and status in (
      'static_analysis',
      'ai_analysis'
    );

  if active_review_count >= 1 then
    raise exception
      'An analysis is already processing';
  end if;

  select count(*)
  into queued_review_count
  from public.reviews
  where user_id = current_user_id
    and status = 'queued';

  if queued_review_count >= 3 then
    raise exception
      'Maximum queued review limit reached';
  end if;

  select count(*)
  into completed_today_count
  from public.reviews
  where user_id = current_user_id
    and status = 'completed'
    and completed_at >= date_trunc(
      'day',
      now()
    )
    and completed_at < date_trunc(
      'day',
      now()
    ) + interval '1 day';

  if completed_today_count >= 20 then
    raise exception
      'Daily review quota reached';
  end if;

  update public.reviews
  set
    status = 'queued',
    error_message = null
  where id = target_review_id
    and user_id = current_user_id
    and status = 'draft'
    and file_count between 1 and 10
  returning id
  into validated_review_id;

  if validated_review_id is null then
    raise exception
      'Review is unavailable or cannot be queued';
  end if;

  select sent_message_id
  into queue_message_id
  from pgmq.send(
    'review_analysis',
    jsonb_build_object(
      'version',
      1,
      'jobType',
      'static-analysis',
      'reviewId',
      validated_review_id,
      'userId',
      current_user_id,
      'queuedAt',
      now()
    ),
    0
  ) as sent_message_id;

  return queue_message_id;
end;
$$;


revoke all
on function public.enqueue_review_analysis(uuid)
from public, anon;

grant execute
on function public.enqueue_review_analysis(uuid)
to authenticated, service_role;


-- ============================================================
-- Worker-only operation:
-- Claim one job for a visibility window.
-- ============================================================

create or replace function public.read_review_analysis_job(
  visibility_timeout_seconds integer default 120
)
returns table (
  msg_id bigint,
  read_ct bigint,
  enqueued_at timestamptz,
  vt timestamptz,
  message jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if visibility_timeout_seconds < 30
    or visibility_timeout_seconds > 600
  then
    raise exception
      'Visibility timeout must be between 30 and 600 seconds';
  end if;

  return query
  select
    queue_message.msg_id,
    queue_message.read_ct,
    queue_message.enqueued_at,
    queue_message.vt,
    queue_message.message
  from pgmq.read(
    'review_analysis',
    visibility_timeout_seconds,
    1
  ) as queue_message;
end;
$$;


revoke all
on function public.read_review_analysis_job(integer)
from public, anon, authenticated;

grant execute
on function public.read_review_analysis_job(integer)
to service_role;


-- ============================================================
-- Worker-only operation:
-- Archive a successfully processed message.
-- ============================================================

create or replace function public.archive_review_analysis_job(
  target_message_id bigint
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.archive(
    'review_analysis',
    target_message_id
  );
$$;


revoke all
on function public.archive_review_analysis_job(bigint)
from public, anon, authenticated;

grant execute
on function public.archive_review_analysis_job(bigint)
to service_role;


-- ============================================================
-- Worker-only operation:
-- Permanently delete an unrecoverable queue message.
-- ============================================================

create or replace function public.delete_review_analysis_job(
  target_message_id bigint
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.delete(
    'review_analysis',
    target_message_id
  );
$$;


revoke all
on function public.delete_review_analysis_job(bigint)
from public, anon, authenticated;

grant execute
on function public.delete_review_analysis_job(bigint)
to service_role;