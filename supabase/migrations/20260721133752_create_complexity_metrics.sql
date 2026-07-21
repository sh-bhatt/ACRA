-- ============================================================
-- ACRA: Per-file complexity metrics
-- ============================================================

create table public.complexity_metrics (
  id uuid primary key default gen_random_uuid(),

  review_id uuid not null,
  file_id uuid not null,
  user_id uuid not null,

  lines_of_code integer not null
    check (lines_of_code >= 0),

  blank_lines integer not null
    check (blank_lines >= 0),

  comment_lines integer not null
    check (comment_lines >= 0),

  function_count integer not null
    check (function_count >= 0),

  class_count integer not null
    check (class_count >= 0),

  import_count integer not null
    check (import_count >= 0),

  cyclomatic_complexity double precision not null
    check (cyclomatic_complexity >= 0),

  maximum_nesting_depth integer not null
    check (maximum_nesting_depth >= 0),

  average_function_length double precision not null
    check (average_function_length >= 0),

  maximum_function_length integer not null
    check (maximum_function_length >= 0),

  maintainability_score double precision not null
    check (
      maintainability_score between 0 and 100
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint complexity_metrics_review_owner_fk
    foreign key (
      review_id,
      user_id
    )
    references public.reviews (
      id,
      user_id
    )
    on delete cascade,

  constraint complexity_metrics_file_review_owner_fk
    foreign key (
      file_id,
      review_id,
      user_id
    )
    references public.review_files (
      id,
      review_id,
      user_id
    )
    on delete cascade,

  constraint complexity_metrics_file_id_key
    unique (file_id)
);


-- ============================================================
-- Indexes
-- ============================================================

create index complexity_metrics_review_id_idx
  on public.complexity_metrics (
    review_id
  );

create index complexity_metrics_user_review_idx
  on public.complexity_metrics (
    user_id,
    review_id
  );


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.complexity_metrics
enable row level security;

revoke all
on table public.complexity_metrics
from anon, authenticated;

grant select
on table public.complexity_metrics
to authenticated;

grant all
on table public.complexity_metrics
to service_role;


create policy
  "Users can view complexity metrics from their own reviews"
on public.complexity_metrics
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


-- ============================================================
-- Retry-safe worker persistence RPC
-- ============================================================

create or replace function public.upsert_complexity_metrics_for_file(
  target_review_id uuid,
  target_file_id uuid,
  target_user_id uuid,
  target_metrics jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if jsonb_typeof(target_metrics)
    is distinct from 'object'
  then
    raise exception using
      errcode = '22023',
      message =
        'target_metrics must be a JSON object';
  end if;

  -- Confirm the review, file and user belong together.
  -- Metrics may only be written while static analysis
  -- is actively processing the review.

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
      message =
        'Review file is not available for complexity persistence';
  end if;

  insert into public.complexity_metrics (
    review_id,
    file_id,
    user_id,
    lines_of_code,
    blank_lines,
    comment_lines,
    function_count,
    class_count,
    import_count,
    cyclomatic_complexity,
    maximum_nesting_depth,
    average_function_length,
    maximum_function_length,
    maintainability_score
  )
  values (
    target_review_id,
    target_file_id,
    target_user_id,
    (target_metrics ->> 'linesOfCode')::integer,
    (target_metrics ->> 'blankLines')::integer,
    (target_metrics ->> 'commentLines')::integer,
    (target_metrics ->> 'functionCount')::integer,
    (target_metrics ->> 'classCount')::integer,
    (target_metrics ->> 'importCount')::integer,
    (target_metrics ->> 'cyclomaticComplexity')::double precision,
    (target_metrics ->> 'maximumNestingDepth')::integer,
    (target_metrics ->> 'averageFunctionLength')::double precision,
    (target_metrics ->> 'maximumFunctionLength')::integer,
    (target_metrics ->> 'maintainabilityScore')::double precision
  )
  on conflict (file_id)
  do update
  set
    review_id =
      excluded.review_id,

    user_id =
      excluded.user_id,

    lines_of_code =
      excluded.lines_of_code,

    blank_lines =
      excluded.blank_lines,

    comment_lines =
      excluded.comment_lines,

    function_count =
      excluded.function_count,

    class_count =
      excluded.class_count,

    import_count =
      excluded.import_count,

    cyclomatic_complexity =
      excluded.cyclomatic_complexity,

    maximum_nesting_depth =
      excluded.maximum_nesting_depth,

    average_function_length =
      excluded.average_function_length,

    maximum_function_length =
      excluded.maximum_function_length,

    maintainability_score =
      excluded.maintainability_score,

    updated_at = now();

  return true;
end;
$function$;


-- ============================================================
-- RPC permissions
-- ============================================================

revoke all
on function public.upsert_complexity_metrics_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from public;

revoke all
on function public.upsert_complexity_metrics_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from anon;

revoke all
on function public.upsert_complexity_metrics_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from authenticated;

grant execute
on function public.upsert_complexity_metrics_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
to service_role;