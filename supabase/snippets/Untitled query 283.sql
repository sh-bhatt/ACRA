select
    schemaname,
    tablename,
    rowsecurity
from pg_tables
where tablename = 'ai_reviews';
