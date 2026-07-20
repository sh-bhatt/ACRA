begin;

-- Simulate an authenticated request made by User A.
set local role authenticated;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '1f6c3cc9-d44a-4a1f-ab90-9ae9ba582bc6',
    'role', 'authenticated'
  )::text,
  true
);

-- ============================================================
-- TEST 1: User A can read their own profile
-- Expected: 1
-- ============================================================

select
  'User A reads own profile' as test,
  count(*) as visible_rows
from public.profiles
where user_id = '1f6c3cc9-d44a-4a1f-ab90-9ae9ba582bc6';


-- ============================================================
-- TEST 2: User A cannot read User B's profile
-- Expected: 0
-- ============================================================

select
  'User A reads User B profile' as test,
  count(*) as visible_rows
from public.profiles
where user_id = '4f5e9290-b09a-4dc9-83e4-bdf97d81378c';


-- ============================================================
-- TEST 3: User A can update their own profile
-- Expected: 1
-- Transaction will be rolled back afterwards.
-- ============================================================

with updated_rows as (
  update public.profiles
  set name = name
  where user_id = '1f6c3cc9-d44a-4a1f-ab90-9ae9ba582bc6'
  returning user_id
)
select
  'User A updates own profile' as test,
  count(*) as updated_rows
from updated_rows;


-- ============================================================
-- TEST 4: User A cannot update User B's profile
-- Expected: 0
-- ============================================================

with updated_rows as (
  update public.profiles
  set name = 'RLS_BLOCK_TEST'
  where user_id = '4f5e9290-b09a-4dc9-83e4-bdf97d81378c'
  returning user_id
)
select
  'User A updates User B profile' as test,
  count(*) as updated_rows
from updated_rows;


-- Undo every test-side change.
rollback;