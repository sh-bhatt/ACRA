select
    pg_get_functiondef(
        'public.enqueue_review_analysis(uuid)'::regprocedure
    );
    