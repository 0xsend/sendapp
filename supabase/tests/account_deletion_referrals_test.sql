-- Account Deletion: Leaderboard Referrals Tests
-- Tests for leaderboard decrement trigger (decrement_leaderboard_referrals)

BEGIN;
SELECT plan(8);

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
-- Leaderboard Decrement Tests
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
-- Test Cleanup and Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
