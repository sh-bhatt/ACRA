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
declare
  parsed_lines_of_code integer;
  parsed_blank_lines integer;
  parsed_comment_lines integer;
  parsed_function_count integer;
  parsed_class_count integer;
  parsed_import_count integer;
  parsed_cyclomatic_complexity double precision;
  parsed_maximum_nesting_depth integer;
  parsed_average_function_length double precision;
  parsed_maximum_function_length integer;
  parsed_maintainability_score double precision;
begin
  if jsonb_typeof(target_metrics)
    is distinct from 'object'
  then
    raise exception using
      errcode = '22023',
      message =
        'target_metrics must be a JSON object';
  end if;

  if not exists (
    select 1
    from public.review_files as review_file
    inner join public.reviews as review
      on review.id = review_file.review_id
      and review.user_id = review_file.user_id
    where review_file.id = target_file_id
      and review_file.review_id =
        target_review_id
      and review_file.user_id =
        target_user_id
      and review.status =
        'static_analysis'
  ) then
    raise exception using
      errcode = 'P0001',
      message =
        'Review file is not available for complexity persistence';
  end if;

  begin
    parsed_lines_of_code :=
      (target_metrics ->> 'linesOfCode')::integer;

    parsed_blank_lines :=
      (target_metrics ->> 'blankLines')::integer;

    parsed_comment_lines :=
      (target_metrics ->> 'commentLines')::integer;

    parsed_function_count :=
      (target_metrics ->> 'functionCount')::integer;

    parsed_class_count :=
      (target_metrics ->> 'classCount')::integer;

    parsed_import_count :=
      (target_metrics ->> 'importCount')::integer;

   parsed_cyclomatic_complexity :=
  (target_metrics ->> 'cyclomaticComplexity')::double precision;

parsed_maximum_nesting_depth :=
  (target_metrics ->> 'maximumNestingDepth')::integer;

parsed_average_function_length :=
  (target_metrics ->> 'averageFunctionLength')::double precision;

parsed_maximum_function_length :=
  (target_metrics ->> 'maximumFunctionLength')::integer;

parsed_maintainability_score :=
  (target_metrics ->> 'maintainabilityScore')::double precision;
  exception
    when invalid_text_representation then
      raise exception using
        errcode = '22023',
        message =
          'target_metrics contains an invalid numeric value';
  end;

  if
    parsed_lines_of_code is null
    or parsed_blank_lines is null
    or parsed_comment_lines is null
    or parsed_function_count is null
    or parsed_class_count is null
    or parsed_import_count is null
    or parsed_cyclomatic_complexity is null
    or parsed_maximum_nesting_depth is null
    or parsed_average_function_length is null
    or parsed_maximum_function_length is null
    or parsed_maintainability_score is null
  then
    raise exception using
      errcode = '22023',
      message =
        'target_metrics is missing one or more required fields';
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
    parsed_lines_of_code,
    parsed_blank_lines,
    parsed_comment_lines,
    parsed_function_count,
    parsed_class_count,
    parsed_import_count,
    parsed_cyclomatic_complexity,
    parsed_maximum_nesting_depth,
    parsed_average_function_length,
    parsed_maximum_function_length,
    parsed_maintainability_score
  )
  on conflict (
    review_id,
    file_id
  )
  do update
  set
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


revoke all
on function public.upsert_complexity_metrics_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
from public, anon, authenticated;

grant execute
on function public.upsert_complexity_metrics_for_file(
  uuid,
  uuid,
  uuid,
  jsonb
)
to service_role;