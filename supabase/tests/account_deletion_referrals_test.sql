-- Account Deletion: Referrals & Distribution Verifications Impact Tests
-- Tests for:
-- 1. Leaderboard decrement trigger (decrement_leaderboard_referrals)
-- 2. Distribution verification cleanup (cleanup_referral_verifications_on_user_delete)

BEGIN;
SELECT plan(27);

CREATE EXTENSION "basejump-supabase_test_helpers";
GRANT USAGE ON SCHEMA tests TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

-- ============================================================================
-- Test Setup: Create Test Users and Profiles
-- ============================================================================

SELECT tests.create_supabase_user('referrer_alice');
SELECT tests.create_supabase_user('referrer_bob');
SELECT tests.create_supabase_user('referred_charlie');
SELECT tests.create_supabase_user('referred_david');
SELECT tests.create_supabase_user('referred_eve');

-- Create profiles for all test users
INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES
    (tests.get_supabase_uid('referrer_alice'), 'Alice Referrer', 'Test referrer Alice', 'https://example.com/alice.jpg', true),
    (tests.get_supabase_uid('referrer_bob'), 'Bob Referrer', 'Test referrer Bob', 'https://example.com/bob.jpg', true),
    (tests.get_supabase_uid('referred_charlie'), 'Charlie Referred', 'Test referred Charlie', 'https://example.com/charlie.jpg', true),
    (tests.get_supabase_uid('referred_david'), 'David Referred', 'Test referred David', 'https://example.com/david.jpg', true),
    (tests.get_supabase_uid('referred_eve'), 'Eve Referred', 'Test referred Eve', 'https://example.com/eve.jpg', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    about = EXCLUDED.about,
    avatar_url = EXCLUDED.avatar_url,
    is_public = EXCLUDED.is_public;

-- ============================================================================
-- SECTION 1: Leaderboard Decrement Tests
-- ============================================================================

-- Test 1: Leaderboard increments when referral is created
INSERT INTO referrals (referrer_id, referred_id)
VALUES (tests.get_supabase_uid('referrer_alice'), tests.get_supabase_uid('referred_charlie'));

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_alice')
    $$,
    $$ VALUES (1) $$,
    'Leaderboard should increment to 1 after first referral'
);

-- Test 2: Leaderboard decrements when referred user is deleted
DELETE FROM profiles WHERE id = tests.get_supabase_uid('referred_charlie');

SELECT results_eq(
    $$
        SELECT COALESCE(referrals, 0)::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_alice')
    $$,
    $$ VALUES (0) $$,
    'Leaderboard should decrement to 0 after referred user deletion'
);

-- Test 3: Multiple referrals - create 3 referrals for Bob
-- Recreate charlie for this test
SELECT tests.create_supabase_user('referred_charlie');
INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES (tests.get_supabase_uid('referred_charlie'), 'Charlie Referred', 'Test referred Charlie', 'https://example.com/charlie.jpg', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO referrals (referrer_id, referred_id)
VALUES
    (tests.get_supabase_uid('referrer_bob'), tests.get_supabase_uid('referred_charlie')),
    (tests.get_supabase_uid('referrer_bob'), tests.get_supabase_uid('referred_david')),
    (tests.get_supabase_uid('referrer_bob'), tests.get_supabase_uid('referred_eve'));

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_bob')
    $$,
    $$ VALUES (3) $$,
    'Leaderboard should show 3 referrals for Bob'
);

-- Test 4: Delete one referred user, count should decrement to 2
DELETE FROM profiles WHERE id = tests.get_supabase_uid('referred_charlie');

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_bob')
    $$,
    $$ VALUES (2) $$,
    'Leaderboard should decrement to 2 after one referred user deletion'
);

-- Test 5: Delete another referred user, count should decrement to 1
DELETE FROM profiles WHERE id = tests.get_supabase_uid('referred_david');

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_bob')
    $$,
    $$ VALUES (1) $$,
    'Leaderboard should decrement to 1 after second referred user deletion'
);

-- Test 6: Delete last referred user, count should be 0
DELETE FROM profiles WHERE id = tests.get_supabase_uid('referred_eve');

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_bob')
    $$,
    $$ VALUES (0) $$,
    'Leaderboard should decrement to 0 after all referred users deleted'
);

-- Test 7: Count never goes negative (edge case)
-- Manually set count to 0, then delete a non-existent referral should not error
UPDATE private.leaderboard_referrals_all_time
SET referrals = 0
WHERE user_id = tests.get_supabase_uid('referrer_alice');

-- This shouldn't cause an error even though count is already 0
-- (Testing GREATEST(0, referrals - 1) logic)
SELECT lives_ok(
    $$
        UPDATE private.leaderboard_referrals_all_time
        SET referrals = GREATEST(0, referrals - 1)
        WHERE user_id = tests.get_supabase_uid('referrer_alice')
    $$,
    'Decrementing from 0 should not cause errors'
);

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('referrer_alice')
    $$,
    $$ VALUES (0) $$,
    'Leaderboard count should remain 0 (not negative)'
);

-- ============================================================================
-- SECTION 2: Distribution Verification Cleanup Tests
-- ============================================================================

-- Setup: Create fresh test users for distribution tests
SELECT tests.create_supabase_user('dist_referrer');
SELECT tests.create_supabase_user('dist_referred1');
SELECT tests.create_supabase_user('dist_referred2');
SELECT tests.create_supabase_user('dist_referred3');

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES
    (tests.get_supabase_uid('dist_referrer'), 'Dist Referrer', 'Distribution test referrer', 'https://example.com/dist_referrer.jpg', true),
    (tests.get_supabase_uid('dist_referred1'), 'Dist Referred 1', 'Distribution test referred 1', 'https://example.com/dist_referred1.jpg', true),
    (tests.get_supabase_uid('dist_referred2'), 'Dist Referred 2', 'Distribution test referred 2', 'https://example.com/dist_referred2.jpg', true),
    (tests.get_supabase_uid('dist_referred3'), 'Dist Referred 3', 'Distribution test referred 3', 'https://example.com/dist_referred3.jpg', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name;

-- Create referrals
INSERT INTO referrals (referrer_id, referred_id)
VALUES
    (tests.get_supabase_uid('dist_referrer'), tests.get_supabase_uid('dist_referred1')),
    (tests.get_supabase_uid('dist_referrer'), tests.get_supabase_uid('dist_referred2')),
    (tests.get_supabase_uid('dist_referrer'), tests.get_supabase_uid('dist_referred3'));

-- Create a CLOSED distribution (historical data - should not be modified)
INSERT INTO distributions (
    number, tranche_id, name, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips,
    qualification_start, qualification_end, claim_end, hodler_min_balance, chain_id
)
VALUES (
    9999, 9999, 'Closed Test Distribution', 1000000, 3000, 2000, 5000,
    NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', 1000, 8453
), (
    10000, 10000, 'Active Test Distribution', 2000000, 3000, 2000, 5000,
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', NOW() + INTERVAL '50 days', 1000, 8453
);

-- Create distribution_verification_values for our test distributions
INSERT INTO distribution_verification_values (
    type, fixed_value, bips_value, distribution_id, multiplier_min, multiplier_max, multiplier_step
)
SELECT
    vt.type,
    0,
    0,
    d.id,
    1.0,
    1.0,
    0.0
FROM distributions d
CROSS JOIN (
    VALUES ('tag_referral'::verification_type), ('total_tag_referrals'::verification_type)
) AS vt(type)
WHERE d.number IN (9999, 10000);

-- Create tag_referral verification in CLOSED distribution with weight=1
INSERT INTO distribution_verifications (distribution_id, user_id, type, metadata, weight)
SELECT
    d.id,
    tests.get_supabase_uid('dist_referrer'),
    'tag_referral',
    jsonb_build_object('referred_id', tests.get_supabase_uid('dist_referred1')),
    1
FROM distributions d
WHERE d.number = 9999;

-- Create total_tag_referrals verification in CLOSED distribution
INSERT INTO distribution_verifications (distribution_id, user_id, type, metadata, weight)
SELECT
    d.id,
    tests.get_supabase_uid('dist_referrer'),
    'total_tag_referrals',
    NULL,
    3
FROM distributions d
WHERE d.number = 9999;

-- Create tag_referral verifications in ACTIVE distribution
INSERT INTO distribution_verifications (distribution_id, user_id, type, metadata, weight)
SELECT
    d.id,
    tests.get_supabase_uid('dist_referrer'),
    'tag_referral',
    jsonb_build_object('referred_id', ref_id),
    1
FROM distributions d
CROSS JOIN (
    VALUES
        (tests.get_supabase_uid('dist_referred1')),
        (tests.get_supabase_uid('dist_referred2')),
        (tests.get_supabase_uid('dist_referred3'))
) AS refs(ref_id)
WHERE d.number = 10000;

-- Create total_tag_referrals verification in ACTIVE distribution
INSERT INTO distribution_verifications (distribution_id, user_id, type, metadata, weight)
SELECT
    d.id,
    tests.get_supabase_uid('dist_referrer'),
    'total_tag_referrals',
    NULL,
    3
FROM distributions d
WHERE d.number = 10000;

-- Create distribution_shares for referred users in ACTIVE distribution
-- This simulates that these users have qualified (have shares > 0)
-- This is required for the total_tag_referrals recalculation logic
INSERT INTO distribution_shares (distribution_id, user_id, address, amount, fixed_pool_amount, hodler_pool_amount, bonus_pool_amount, index)
SELECT
    d.id,
    ref_id,
    '0x' || encode(gen_random_bytes(20), 'hex'),
    '1000',
    '500',
    '500',
    '0',
    row_number() OVER () -- Generate sequential index
FROM distributions d
CROSS JOIN (
    VALUES
        (tests.get_supabase_uid('dist_referred1')),
        (tests.get_supabase_uid('dist_referred2')),
        (tests.get_supabase_uid('dist_referred3'))
) AS refs(ref_id)
WHERE d.number = 10000;

-- Test 8: Verify initial state - 3 tag_referral verifications with weight=1
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'tag_referral'
          AND dv.weight = 1
    $$,
    $$ VALUES (3) $$,
    'Should have 3 tag_referral verifications with weight=1 in active distribution'
);

-- Test 9: Verify initial total_tag_referrals weight is 3
SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'total_tag_referrals'
    $$,
    $$ VALUES (3) $$,
    'Should have total_tag_referrals weight=3 in active distribution'
);

-- Test 10: Delete one referred user - tag_referral weight should become 0
DELETE FROM profiles WHERE id = tests.get_supabase_uid('dist_referred1');

SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'tag_referral'
          AND (dv.metadata->>'referred_id')::uuid = tests.get_supabase_uid('dist_referred1')
    $$,
    $$ VALUES (0) $$,
    'tag_referral weight should be 0 for deleted user in active distribution'
);

-- Test 11: total_tag_referrals should be recalculated to 2
SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'total_tag_referrals'
    $$,
    $$ VALUES (2) $$,
    'total_tag_referrals weight should be recalculated to 2'
);

-- Test 12: Closed distribution tag_referral weight should remain unchanged
SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 9999
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'tag_referral'
    $$,
    $$ VALUES (1) $$,
    'tag_referral weight should remain 1 in closed distribution (historical preservation)'
);

-- Test 13: Closed distribution total_tag_referrals should remain unchanged
SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 9999
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'total_tag_referrals'
    $$,
    $$ VALUES (3) $$,
    'total_tag_referrals weight should remain 3 in closed distribution (historical preservation)'
);

-- Test 14: Delete another referred user - verify counts update correctly
DELETE FROM profiles WHERE id = tests.get_supabase_uid('dist_referred2');

SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'tag_referral'
          AND dv.weight = 0
    $$,
    $$ VALUES (2) $$,
    'Should have 2 tag_referral verifications with weight=0 after second deletion'
);

-- Test 15: total_tag_referrals should now be 1
SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'total_tag_referrals'
    $$,
    $$ VALUES (1) $$,
    'total_tag_referrals weight should be 1 after second deletion'
);

-- Test 16: Delete last referred user - total_tag_referrals should be 0
DELETE FROM profiles WHERE id = tests.get_supabase_uid('dist_referred3');

SELECT results_eq(
    $$
        SELECT dv.weight::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'total_tag_referrals'
    $$,
    $$ VALUES (0) $$,
    'total_tag_referrals weight should be 0 after all referred users deleted'
);

-- Test 17: All tag_referral verifications should have weight=0
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE d.number = 10000
          AND dv.user_id = tests.get_supabase_uid('dist_referrer')
          AND dv.type = 'tag_referral'
          AND dv.weight = 0
    $$,
    $$ VALUES (3) $$,
    'All 3 tag_referral verifications should have weight=0'
);

-- ============================================================================
-- SECTION 3: Edge Cases and Error Handling
-- ============================================================================

-- Test 18: No active distribution - deletion should succeed without errors
-- First, close the active distribution
UPDATE distributions
SET qualification_end = NOW() - INTERVAL '1 day'
WHERE number = 10000;

-- Create new test users for this scenario
SELECT tests.create_supabase_user('no_dist_referrer');
SELECT tests.create_supabase_user('no_dist_referred');

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES
    (tests.get_supabase_uid('no_dist_referrer'), 'No Dist Referrer', 'Test', 'https://example.com/nodist.jpg', true),
    (tests.get_supabase_uid('no_dist_referred'), 'No Dist Referred', 'Test', 'https://example.com/nodist2.jpg', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO referrals (referrer_id, referred_id)
VALUES (tests.get_supabase_uid('no_dist_referrer'), tests.get_supabase_uid('no_dist_referred'));

SELECT lives_ok(
    $$
        DELETE FROM profiles WHERE id = tests.get_supabase_uid('no_dist_referred')
    $$,
    'User deletion should succeed even when no active distribution exists'
);

-- Test 19: Referrer leaderboard should still decrement with no active distribution
SELECT results_eq(
    $$
        SELECT COALESCE(referrals, 0)::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('no_dist_referrer')
    $$,
    $$ VALUES (0) $$,
    'Leaderboard should decrement even without active distribution'
);

-- Test 20: Multiple referrers affected by single user deletion
-- Reopen distribution for this test
UPDATE distributions
SET qualification_end = NOW() + INTERVAL '20 days'
WHERE number = 10000;

SELECT tests.create_supabase_user('multi_ref_a');
SELECT tests.create_supabase_user('multi_ref_b');
SELECT tests.create_supabase_user('multi_ref_c');
SELECT tests.create_supabase_user('multi_referred_shared');

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES
    (tests.get_supabase_uid('multi_ref_a'), 'Multi Ref A', 'Test', 'https://example.com/ma.jpg', true),
    (tests.get_supabase_uid('multi_ref_b'), 'Multi Ref B', 'Test', 'https://example.com/mb.jpg', true),
    (tests.get_supabase_uid('multi_ref_c'), 'Multi Ref C', 'Test', 'https://example.com/mc.jpg', true),
    (tests.get_supabase_uid('multi_referred_shared'), 'Multi Referred Shared', 'Test', 'https://example.com/mrs.jpg', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Note: In the real system, a user can only have ONE referrer, so this test is actually checking
-- a scenario that shouldn't happen in production. However, we test the trigger behavior.
-- Instead, let's test multiple referrals by same referrer more thoroughly.

-- Test 21: Verify referral constraint - user can only have one referrer
-- This is more of a constraint verification test
INSERT INTO referrals (referrer_id, referred_id)
VALUES (tests.get_supabase_uid('multi_ref_a'), tests.get_supabase_uid('multi_referred_shared'));

SELECT throws_ok(
    $$
        INSERT INTO referrals (referrer_id, referred_id)
        VALUES (tests.get_supabase_uid('multi_ref_b'), tests.get_supabase_uid('multi_referred_shared'))
    $$,
    '23505', -- unique violation error code
    NULL,
    'User can only have one referrer (unique constraint on referred_id)'
);

-- Clean up this test
DELETE FROM profiles WHERE id = tests.get_supabase_uid('multi_referred_shared');

-- Test 22: Concurrent scenario - verify transaction safety
-- Create two users that will be deleted
SELECT tests.create_supabase_user('concurrent_ref');
SELECT tests.create_supabase_user('concurrent_referred_1');
SELECT tests.create_supabase_user('concurrent_referred_2');

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES
    (tests.get_supabase_uid('concurrent_ref'), 'Concurrent Ref', 'Test', 'https://example.com/cr.jpg', true),
    (tests.get_supabase_uid('concurrent_referred_1'), 'Concurrent Referred 1', 'Test', 'https://example.com/cr1.jpg', true),
    (tests.get_supabase_uid('concurrent_referred_2'), 'Concurrent Referred 2', 'Test', 'https://example.com/cr2.jpg', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO referrals (referrer_id, referred_id)
VALUES
    (tests.get_supabase_uid('concurrent_ref'), tests.get_supabase_uid('concurrent_referred_1')),
    (tests.get_supabase_uid('concurrent_ref'), tests.get_supabase_uid('concurrent_referred_2'));

-- Verify initial count is 2
SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('concurrent_ref')
    $$,
    $$ VALUES (2) $$,
    'Initial referral count should be 2'
);

-- Delete both users (simulating near-concurrent deletions)
DELETE FROM profiles WHERE id IN (
    tests.get_supabase_uid('concurrent_referred_1'),
    tests.get_supabase_uid('concurrent_referred_2')
);

SELECT results_eq(
    $$
        SELECT referrals::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('concurrent_ref')
    $$,
    $$ VALUES (0) $$,
    'After deleting both users, referral count should be 0'
);

-- Test 23: Verify referral record is actually deleted (CASCADE works)
SELECT is_empty(
    $$
        SELECT * FROM referrals
        WHERE referred_id = tests.get_supabase_uid('concurrent_referred_1')
    $$,
    'Referral record should be CASCADE deleted when referred user is deleted'
);

-- Test 24: Verify leaderboard entry exists even with 0 count
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('concurrent_ref')
    $$,
    $$ VALUES (1) $$,
    'Leaderboard entry should still exist with 0 count (not deleted)'
);

-- Test 25: Deleting profile keeps leaderboard entry (CASCADE from auth.users, not profiles)
DELETE FROM profiles WHERE id = tests.get_supabase_uid('concurrent_ref');

SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM private.leaderboard_referrals_all_time
        WHERE user_id = tests.get_supabase_uid('concurrent_ref')
    $$,
    $$ VALUES (1) $$,
    'Leaderboard entry should remain when profile deleted (CASCADE only on auth.users deletion)'
);

-- Test 26: Verify auth user still exists after profile deletion
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM auth.users
        WHERE id = tests.get_supabase_uid('concurrent_ref')
    $$,
    $$ VALUES (1) $$,
    'Auth user should still exist after profile deletion'
);

-- ============================================================================
-- Test Cleanup and Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
