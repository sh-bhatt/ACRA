select
id,
status
from reviews
where user_id = auth.uid();