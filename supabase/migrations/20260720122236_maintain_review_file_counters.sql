-- ============================================================
-- ACRA: Maintain review file counters automatically
-- ============================================================

create or replace function public.sync_review_file_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.reviews
    set
      file_count = file_count + 1,
      total_lines = total_lines + new.line_count
    where id = new.review_id
      and user_id = new.user_id
      and file_count < 10;

    if not found then
      raise exception
        'Review not found or maximum file limit exceeded';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.reviews
    set
      file_count = greatest(file_count - 1, 0),
      total_lines = greatest(
        total_lines - old.line_count,
        0
      )
    where id = old.review_id
      and user_id = old.user_id;

    return old;
  end if;

  return null;
end;
$$;

revoke execute
on function public.sync_review_file_counters()
from public, anon, authenticated;

create trigger sync_review_file_counters
after insert or delete on public.review_files
for each row
execute function public.sync_review_file_counters(); 