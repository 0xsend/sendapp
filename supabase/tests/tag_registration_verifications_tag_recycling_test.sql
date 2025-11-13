BEGIN;
SELECT plan(4);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Setup test users
SELECT tests.create_supabase_user('user_a');
SELECT tests.create_supabase_user('user_b');

SET ROLE service_role;

-- Ensure profiles exist
UPDATE profiles
SET name = 'User A',
    avatar_url = 'https://example.com/avatar_a.jpg'
WHERE id = tests.get_supabase_uid('user_a');

UPDATE profiles
SET name = 'User B',
    avatar_url = 'https://example.com/avatar_b.jpg'
WHERE id = tests.get_supabase_uid('user_b');

-- Create send accounts for both users
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('user_a'),
    '0x1111111111111111111111111111111111111111',
    8453,
    '\\x00'
), (
    tests.get_supabase_uid('user_b'),
    '0x2222222222222222222222222222222222222222',
    8453,
    '\\x00'
);

-- Create a distribution with unique number
INSERT INTO distributions (
    number,
    tranche_id,
    name,
    amount,
    hodler_pool_bips,
    bonus_pool_bips,
    fixed_pool_bips,
    qualification_start,
    qualification_end,
    hodler_min_balance,
    claim_end,
    chain_id
) VALUES (
    9020,
    1,
    'Test Distribution',
    100000,
    5000,
    2500,
    2500,
    NOW() - INTERVAL '2 months',
    NOW() - INTERVAL '1 month',
    1e6::bigint,
    NOW() - INTERVAL '15 days',
    8453
);

-- Create distribution verification values for tag_registration type
INSERT INTO distribution_verification_values (
    type,
    fixed_value,
    bips_value,
    distribution_id,
    multiplier_min,
    multiplier_max,
    multiplier_step
)
SELECT
    'tag_registration'::verification_type,
    0,
    0,
    id,
    1.0,
    1.0,
    0.0
FROM distributions
WHERE number = 9020
ORDER BY id DESC
LIMIT 1;

-- User A buys @alice
INSERT INTO tags (name, status, user_id)
VALUES ('alice', 'confirmed', tests.get_supabase_uid('user_a'));

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user_a')),
    (SELECT id FROM tags WHERE name = 'alice')
);

-- Create receipt for User A's tag (older receipt)
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'alice'),
    'alice',
    '100:0:0:0',
    NOW() - INTERVAL '2 months'
);

-- User A deletes @alice
DELETE FROM send_account_tags
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user_a'))
AND tag_id = (SELECT id FROM tags WHERE name = 'alice');

-- Tag becomes available, User B buys @alice
UPDATE tags SET user_id = tests.get_supabase_uid('user_b'), status = 'confirmed'
WHERE name = 'alice';

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user_b')),
    (SELECT id FROM tags WHERE name = 'alice')
);

-- Create NEW receipt for User B's tag (newer receipt)
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'alice'),
    'alice',
    '200:0:0:0',
    NOW() - INTERVAL '1 month'
);

-- Run the insert_tag_registration_verifications function
SELECT insert_tag_registration_verifications(9020);

SET ROLE postgres;

-- Test 1: Only current owner (User B) gets verification
SELECT ok(
    EXISTS(
        SELECT 1
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('user_b')
        AND type = 'tag_registration'
        AND metadata->>'tag' = 'alice'
        AND distribution_id = (SELECT id FROM distributions WHERE number = 9020 ORDER BY id DESC LIMIT 1)
    ),
    'Current owner (User B) has verification for tag'
);

-- Test 2: Previous owner (User A) does NOT get verification
SELECT ok(
    NOT EXISTS(
        SELECT 1
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('user_a')
        AND type = 'tag_registration'
        AND metadata->>'tag' = 'alice'
        AND distribution_id = (SELECT id FROM distributions WHERE number = 9020 ORDER BY id DESC LIMIT 1)
    ),
    'Previous owner (User A) does NOT have verification for tag'
);

-- Test 3: Only ONE verification exists for tag @alice
SELECT is(
    (SELECT COUNT(*)
     FROM distribution_verifications
     WHERE type = 'tag_registration'
     AND metadata->>'tag' = 'alice'
     AND distribution_id = (SELECT id FROM distributions WHERE number = 9020 ORDER BY id DESC LIMIT 1))::int,
    1,
    'Only one verification exists for tag alice in distribution'
);

-- Test 4: Weight is calculated correctly from User B's receipt
-- Tag 'alice' has 5 characters, so weight should be 2
SELECT is(
    (SELECT weight
     FROM distribution_verifications
     WHERE user_id = tests.get_supabase_uid('user_b')
     AND type = 'tag_registration'
     AND metadata->>'tag' = 'alice'
     AND distribution_id = (SELECT id FROM distributions WHERE number = 9020 ORDER BY id DESC LIMIT 1))::int,
    2,
    'Weight calculated correctly from current owner receipt (5 chars = weight 2)'
);

SELECT finish();
ROLLBACK;
