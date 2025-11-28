-- Test suite for referral activity deletion on account deletion
-- Tests that referrals are properly deleted via CASCADE chain
BEGIN;

SELECT plan(6); -- Number of tests

-- Setup: Create two users with proper UUIDs
INSERT INTO auth.users (id, email, role, created_at, updated_at)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'charlie-test-referral@example.com', 'authenticated', now(), now()),
    ('44444444-4444-4444-4444-444444444444', 'dave-test-referral@example.com', 'authenticated', now(), now());

-- Wait for profile creation triggers
SELECT pg_sleep(0.1);

-- Verify profiles were created
SELECT ok(
    (SELECT COUNT(*) FROM profiles WHERE id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444')) = 2,
    'Setup: Both user profiles should be created'
);

-- Test Case: Create a referral (Charlie refers Dave)
-- Note: Referral creation typically happens through the referrals table trigger
-- We'll insert directly into the referrals table, which should trigger activity creation

-- First, insert into referrals table (this should trigger the activity creation)
INSERT INTO referrals (referrer_id, referred_id, created_at)
VALUES ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', now());

-- Wait for trigger to create activity
SELECT pg_sleep(0.1);

-- Verify referral activity was created
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_name = 'referrals'
      AND from_user_id = '33333333-3333-3333-3333-333333333333'
      AND to_user_id = '44444444-4444-4444-4444-444444444444'
), 'Setup: Referral activity should be created');

-- Verify referral record exists
SELECT ok(EXISTS(
    SELECT 1 FROM referrals
    WHERE referrer_id = '33333333-3333-3333-3333-333333333333'
      AND referred_id = '44444444-4444-4444-4444-444444444444'
), 'Setup: Referral record should exist in referrals table');

-- Test: Delete Dave (the referred user)
DELETE FROM auth.users WHERE id = '44444444-4444-4444-4444-444444444444';

-- Test 1: Referral should be deleted from referrals table (CASCADE from profiles)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM referrals
    WHERE referrer_id = '33333333-3333-3333-3333-333333333333'
      AND referred_id = '44444444-4444-4444-4444-444444444444'
), 'Test 1: Referral record should be deleted from referrals table');

-- Test 2: Referral activity should be deleted (via referrals_delete_activity_trigger)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM activity
    WHERE event_name = 'referrals'
      AND from_user_id = '33333333-3333-3333-3333-333333333333'
), 'Test 2: Referral activity should be deleted by CASCADE chain');

-- Test 3: Charlie's profile should still exist
SELECT ok(EXISTS(
    SELECT 1 FROM profiles WHERE id = '33333333-3333-3333-3333-333333333333'
), 'Test 3: Charlie profile should still exist (he was the referrer)');

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
