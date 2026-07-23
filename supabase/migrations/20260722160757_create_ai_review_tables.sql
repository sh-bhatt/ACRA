create table public.ai_reviews (
    review_id uuid primary key
        references public.reviews(id)
        on delete cascade,

    summary text not null,

    strengths jsonb not null,

    refactoring_plan jsonb not null,

    generated_documentation text,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now()
);

create table public.ai_review_findings (
    id uuid
        primary key
        default gen_random_uuid(),

    review_id uuid
        not null
        references public.ai_reviews(review_id)
        on delete cascade,

    title text not null,

    category text not null,

    severity text not null,

    confidence double precision not null,

    file_name text not null,

    line_start integer,

    line_end integer,

    explanation text not null,

    suggested_fix text not null,

    replacement_code text
);

create index ai_review_findings_review_id_idx
on public.ai_review_findings(review_id);