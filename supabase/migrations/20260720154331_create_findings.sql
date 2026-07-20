-- ============================================================
-- ACRA: Static and AI review findings
-- ============================================================

-- Composite uniqueness allows findings to enforce that:
-- 1. the review belongs to the supplied user
-- 2. the file belongs to the supplied review and user

alter table public.reviews
add constraint reviews_id_user_id_key
unique (
  id,
  user_id
);


alter table public.review_files
add constraint review_files_id_review_id_user_id_key
unique (
  id,
  review_id,
  user_id
);


create table public.findings (
  id uuid primary key default gen_random_uuid(),

  review_id uuid not null,

  file_id uuid not null,

  user_id uuid not null,

  source text not null
    check (
      source in (
        'static',
        'ai'
      )
    ),

  rule_id text
    check (
      rule_id is null
      or char_length(rule_id) between 1 and 150
    ),

  category text not null
    check (
      category in (
        'bug',
        'security',
        'performance',
        'maintainability',
        'best-practice',
        'documentation',
        'style',
        'complexity'
      )
    ),

  severity text not null
    check (
      severity in (
        'critical',
        'high',
        'medium',
        'low',
        'info'
      )
    ),

  confidence double precision not null
    check (
      confidence between 0 and 1
    ),

  title text not null
    check (
      char_length(title) between 1 and 200
    ),

  explanation text not null
    check (
      char_length(explanation) between 1 and 5000
    ),

  suggested_fix text not null
    check (
      char_length(suggested_fix) between 1 and 10000
    ),

  replacement_code text
    check (
      replacement_code is null
      or char_length(replacement_code) <= 20000
    ),

  line_start integer
    check (
      line_start is null
      or line_start >= 1
    ),

  line_end integer
    check (
      line_end is null
      or line_end >= 1
    ),

  fingerprint text not null
    check (
      char_length(fingerprint) = 64
    ),

  created_at timestamptz not null default now(),

  constraint findings_line_range_check
    check (
      line_end is null
      or (
        line_start is not null
        and line_end >= line_start
      )
    ),

  constraint findings_review_owner_fk
    foreign key (
      review_id,
      user_id
    )
    references public.reviews (
      id,
      user_id
    )
    on delete cascade,

  constraint findings_file_review_owner_fk
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
    on delete cascade
);


-- ============================================================
-- Indexes
-- ============================================================

create index findings_review_created_at_idx
  on public.findings (
    review_id,
    created_at
  );


create index findings_file_id_idx
  on public.findings (
    file_id
  );


create index findings_user_review_idx
  on public.findings (
    user_id,
    review_id
  );


create index findings_review_severity_idx
  on public.findings (
    review_id,
    severity
  );


-- Prevent duplicate findings when the same queue job retries.

create unique index findings_unique_fingerprint_idx
  on public.findings (
    review_id,
    file_id,
    source,
    fingerprint
  );


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.findings
enable row level security;


-- Remove broad/default browser privileges.

revoke all
on table public.findings
from anon, authenticated;


-- Browser users may only read their own findings.
-- Individual findings are not user-editable.
-- Deleting a review removes its findings through cascade.

grant select
on table public.findings
to authenticated;


-- The analysis worker persists and manages findings.

grant all
on table public.findings
to service_role;


-- ============================================================
-- SELECT policy
-- ============================================================

create policy "Users can view findings from their own reviews"
on public.findings
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);