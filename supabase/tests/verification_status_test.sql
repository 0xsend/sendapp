BEGIN;
SELECT plan(7);
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Create a user
SELECT tests.create_supabase_user('verif_user');
SELECT tests.authenticate_as_service_role();

-- Create an active test distribution with no earn requirement (earn_min_balance = 0)
DO $$
DECLARE
  v_now timestamptz := (now() AT TIME ZONE 'UTC');
BEGIN
  INSERT INTO public.distributions(
    number,
    amount,
    hodler_pool_bips,
    bonus_pool_bips,
    fixed_pool_bips,
    name,
    description,
    qualification_start,
    qualification_end,
    claim_end,
    hodler_min_balance,
    chain_id,
    tranche_id,
    earn_min_balance
  ) VALUES (
    990001,
    1000000,
    1000,
    0,
    0,
    'verification test dist',
    'active test dist',
    v_now - interval '1 hour',
    v_now + interval '1 hour',
    v_now + interval '7 days',
    1,
    1,
    990001,
    0
  );
END $$;

-- Seed verification value rows for the two types we will use (required by FK)
SELECT public.insert_verification_value(990001, 'tag_registration', 0, 0, 1, 1, 0);
SELECT public.insert_verification_value(990001, 'send_token_hodler', 0, 0, 1, 1, 0);

-- Helper: fetch active distribution id
CREATE TEMP TABLE __active_dist AS
SELECT id FROM distributions
WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
  AND qualification_end   >= (now() AT TIME ZONE 'UTC')
ORDER BY qualification_start DESC
LIMIT 1;

-- Case 1: No verifications => verified_at is NULL, is_verified false
SELECT results_eq(
  $$
SELECT public.verified_at(p) IS NULL, public.is_verified(p)
  FROM public.profiles p
  WHERE p.id = tests.get_supabase_uid('verif_user')
  $$,
  $$ VALUES (true, false) $$,
  'No verifications -> not verified'
);

-- Case 2: Only tag_registration => still not verified
INSERT INTO public.distribution_verifications(distribution_id, user_id, type, metadata, created_at, weight)
SELECT id, tests.get_supabase_uid('verif_user'), 'tag_registration', jsonb_build_object('tag','x'),
       (now() AT TIME ZONE 'UTC') - interval '30 min', 1
FROM __active_dist;

SELECT results_eq(
  $$
SELECT public.verified_at(p) IS NULL, public.is_verified(p)
  FROM public.profiles p
  WHERE p.id = tests.get_supabase_uid('verif_user')
  $$,
  $$ VALUES (true, false) $$,
  'Only tag_registration -> not verified'
);

-- Case 3: Only hodler => still not verified
DELETE FROM public.distribution_verifications
WHERE user_id = tests.get_supabase_uid('verif_user');

INSERT INTO public.distribution_verifications(distribution_id, user_id, type, metadata, created_at, weight)
SELECT id, tests.get_supabase_uid('verif_user'), 'send_token_hodler', NULL,
       (now() AT TIME ZONE 'UTC') - interval '20 min', 1
FROM __active_dist;

SELECT results_eq(
  $$
SELECT public.verified_at(p) IS NULL, public.is_verified(p)
  FROM public.profiles p
  WHERE p.id = tests.get_supabase_uid('verif_user')
  $$,
  $$ VALUES (true, false) $$,
  'Only hodler -> not verified'
);

-- Case 4: Both tag + hodler (earn requirement is bypassed because earn_min_balance=0)
-- Re-insert tag; keep hodler present
INSERT INTO public.distribution_verifications(distribution_id, user_id, type, metadata, created_at, weight)
SELECT id, tests.get_supabase_uid('verif_user'), 'tag_registration', jsonb_build_object('tag','x'),
       (now() AT TIME ZONE 'UTC') - interval '25 min', 1
FROM __active_dist;

-- Expect verified_at NOT NULL and is_verified true
SELECT results_eq(
  $$
SELECT (public.verified_at(p) IS NOT NULL), public.is_verified(p)
  FROM public.profiles p
  WHERE p.id = tests.get_supabase_uid('verif_user')
  $$,
  $$ VALUES (true, true) $$,
  'Tag + hodler -> verified'
);

-- Case 5: Losing one condition should return NULL again
-- Remove hodler row
DELETE FROM public.distribution_verifications
WHERE user_id = tests.get_supabase_uid('verif_user')
  AND type = 'send_token_hodler';

SELECT results_eq(
  $$
SELECT public.verified_at(p) IS NULL, public.is_verified(p)
  FROM public.profiles p
  WHERE p.id = tests.get_supabase_uid('verif_user')
  $$,
  $$ VALUES (true, false) $$,
  'Lost hodler -> not verified'
);

-- Clean up temp
DROP TABLE __active_dist;

SELECT * FROM finish();
ROLLBACK;
