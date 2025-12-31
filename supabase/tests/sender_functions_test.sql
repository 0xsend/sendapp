BEGIN;
SELECT plan(15);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- ============================================================================
-- Test setup: Create users with profiles, send accounts, tags, and activity
-- ============================================================================

-- Create test users
SELECT tests.create_supabase_user('sender_user');
SELECT tests.create_supabase_user('recipient_user_1');
SELECT tests.create_supabase_user('recipient_user_2');

SET ROLE service_role;

-- Update profiles with required fields (name, avatar_url, is_public)
UPDATE profiles SET
    name = 'Sender User',
    avatar_url = 'https://example.com/sender.png',
    is_public = TRUE
WHERE id = tests.get_supabase_uid('sender_user');

UPDATE profiles SET
    name = 'Recipient One',
    avatar_url = 'https://example.com/recipient1.png',
    is_public = TRUE
WHERE id = tests.get_supabase_uid('recipient_user_1');

UPDATE profiles SET
    name = 'Recipient Two',
    avatar_url = 'https://example.com/recipient2.png',
    is_public = TRUE
WHERE id = tests.get_supabase_uid('recipient_user_2');

-- Create send accounts for all users
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES
    (tests.get_supabase_uid('sender_user'), '0x1111111111111111111111111111111111111111', 8453, '\\x00'),
    (tests.get_supabase_uid('recipient_user_1'), '0x2222222222222222222222222222222222222222', 8453, '\\x00'),
    (tests.get_supabase_uid('recipient_user_2'), '0x3333333333333333333333333333333333333333', 8453, '\\x00');

-- Create and confirm tags for each user
INSERT INTO tags (name, status, user_id)
VALUES
    ('sender_tag', 'confirmed', tests.get_supabase_uid('sender_user')),
    ('recipient1_tag', 'confirmed', tests.get_supabase_uid('recipient_user_1')),
    ('recipient2_tag', 'confirmed', tests.get_supabase_uid('recipient_user_2'));

-- Link tags to send accounts
-- Idempotent: some environments may already have these associations (e.g., from prior runs),
-- so avoid failing the entire file on a duplicate.
INSERT INTO send_account_tags (send_account_id, tag_id)
SELECT sa.id, t.id
FROM send_accounts sa
JOIN tags t ON t.user_id = sa.user_id
ON CONFLICT (send_account_id, tag_id) DO NOTHING;

SET ROLE postgres;

-- ============================================================================
-- Test 1-5: recent_senders() function tests
-- ============================================================================

-- Test 1: recent_senders executes without error for unauthenticated user
SELECT tests.clear_authentication();
SELECT lives_ok(
    $$ SELECT * FROM recent_senders() $$,
    'recent_senders executes without error for unauthenticated user'
);

-- Test 2: recent_senders returns empty for user with no activity
SELECT tests.authenticate_as('sender_user');
SELECT is_empty(
    $$ SELECT * FROM recent_senders() $$,
    'recent_senders returns empty when user has no transfer activity'
);

-- Create activity records for testing (sender -> recipient transfers)
SET ROLE service_role;
INSERT INTO activity (event_id, created_at, event_name, from_user_id, to_user_id, data)
VALUES
    ('transfer_1', NOW() - INTERVAL '1 hour', 'send_account_transfers',
     tests.get_supabase_uid('sender_user'), tests.get_supabase_uid('recipient_user_1'),
     '{"v": 1000000}'),
    ('transfer_2', NOW() - INTERVAL '30 minutes', 'send_account_transfers',
     tests.get_supabase_uid('sender_user'), tests.get_supabase_uid('recipient_user_2'),
     '{"v": 2000000}'),
    ('transfer_3', NOW() - INTERVAL '10 minutes', 'send_account_transfers',
     tests.get_supabase_uid('recipient_user_1'), tests.get_supabase_uid('sender_user'),
     '{"v": 500000}');
SET ROLE postgres;

-- Test 3: recent_senders returns results when user has transfer activity
SELECT tests.authenticate_as('sender_user');
SELECT ok(
    (SELECT COUNT(*) FROM recent_senders()) >= 1,
    'recent_senders returns results when user has transfer activity'
);

-- Test 4: activity_feed_user type has correct column structure including is_verified
SELECT ok(
    (SELECT COUNT(*) = 8 FROM (
        SELECT a.attname FROM pg_type t
        JOIN pg_class c ON t.typrelid = c.oid
        JOIN pg_attribute a ON a.attrelid = c.oid
        WHERE t.typname = 'activity_feed_user' AND a.attnum > 0
    ) sub),
    'activity_feed_user type has 8 columns (including is_verified)'
);

-- Test 5: recent_senders result includes is_verified boolean field
SELECT tests.authenticate_as('sender_user');
SELECT ok(
    (SELECT is_verified IS NOT NULL OR is_verified IS NULL FROM recent_senders() LIMIT 1) IS NOT NULL,
    'recent_senders result includes is_verified field that can be accessed'
);

-- ============================================================================
-- Test 6-10: favourite_senders() function tests
-- ============================================================================

-- Test 6: favourite_senders executes without error for unauthenticated user
SELECT tests.clear_authentication();
SELECT lives_ok(
    $$ SELECT * FROM favourite_senders() $$,
    'favourite_senders executes without error for unauthenticated user'
);

-- Test 7: favourite_senders returns empty for user with no qualifying counterparties
SELECT tests.authenticate_as('sender_user');
SELECT is_empty(
    $$ SELECT * FROM favourite_senders() $$,
    'favourite_senders returns empty when counterparties do not meet earn balance requirements'
);

-- Test 8: favourite_senders function exists and returns correct type
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_type t ON p.prorettype = t.oid
        WHERE p.proname = 'favourite_senders'
        AND t.typname = 'activity_feed_user'
    ),
    'favourite_senders function exists and returns SETOF activity_feed_user'
);

-- Test 9: favourite_senders is SECURITY DEFINER
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_proc
        WHERE proname = 'favourite_senders'
        AND prosecdef = TRUE
    ),
    'favourite_senders is SECURITY DEFINER'
);

-- Test 10: favourite_senders result structure includes is_verified field
SELECT lives_ok(
    $$ SELECT is_verified FROM favourite_senders() LIMIT 0 $$,
    'favourite_senders result structure includes is_verified field'
);

-- ============================================================================
-- Test 11-15: today_birthday_senders() function tests
-- ============================================================================

-- Test 11: today_birthday_senders executes without error for unauthenticated user
SELECT tests.clear_authentication();
SELECT lives_ok(
    $$ SELECT * FROM today_birthday_senders() $$,
    'today_birthday_senders executes without error for unauthenticated user'
);

-- Test 12: today_birthday_senders returns empty when no users have today's birthday
SELECT tests.authenticate_as('sender_user');
SELECT is_empty(
    $$ SELECT * FROM today_birthday_senders() $$,
    'today_birthday_senders returns empty when no users have birthday today'
);

-- Test 13: today_birthday_senders function exists and returns correct type
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_type t ON p.prorettype = t.oid
        WHERE p.proname = 'today_birthday_senders'
        AND t.typname = 'activity_feed_user'
    ),
    'today_birthday_senders function exists and returns SETOF activity_feed_user'
);

-- Test 14: today_birthday_senders is SECURITY DEFINER
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_proc
        WHERE proname = 'today_birthday_senders'
        AND prosecdef = TRUE
    ),
    'today_birthday_senders is SECURITY DEFINER'
);

-- Test 15: today_birthday_senders result structure includes is_verified field
SELECT lives_ok(
    $$ SELECT is_verified FROM today_birthday_senders() LIMIT 0 $$,
    'today_birthday_senders result structure includes is_verified field'
);

SELECT finish();
ROLLBACK;
