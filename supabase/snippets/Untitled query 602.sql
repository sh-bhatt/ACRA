select
    tableowner
from pg_tables
where tablename in (
    'ai_reviews',
    'ai_review_findings'
);