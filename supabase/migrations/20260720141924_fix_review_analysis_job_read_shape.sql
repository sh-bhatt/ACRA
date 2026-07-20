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
language sql
security definer
set search_path = ''
as $function$
  select
    queue_message.msg_id::bigint,
    queue_message.read_ct::bigint,
    queue_message.enqueued_at::timestamptz,
    queue_message.vt::timestamptz,
    queue_message.message::jsonb
  from pgmq.read(
    queue_name => 'review_analysis',
    vt => greatest(1, visibility_timeout_seconds),
    qty => 1
  ) as queue_message;
$function$;

revoke all
on function public.read_review_analysis_job(integer)
from public;

revoke all
on function public.read_review_analysis_job(integer)
from anon;

revoke all
on function public.read_review_analysis_job(integer)
from authenticated;

grant execute
on function public.read_review_analysis_job(integer)
to service_role;