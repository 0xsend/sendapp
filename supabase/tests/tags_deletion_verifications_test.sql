BEGIN;
SELECT plan(4);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Setup test user and send account
SELECT tests.create_supabase_user('user1');

SET ROLE service_role;

-- Ensure profile exists with required fields
UPDATE profiles
SET name = 'User 1',
    avatar_url = 'https://example.com/avatar.jpg'
WHERE id = tests.get_supabase_uid('user1');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('user1'), '0x1234567890123456789012345678901234567890', 8453, '\\x00');

-- Create two distributions with unique numbers
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
    9010,
    1,
    'Past Distribution',
    100000,
    5000,
    2500,
    2500,
    NOW() - INTERVAL '2 months',
    NOW() - INTERVAL '1 month',
    1e6::bigint,
    NOW() - INTERVAL '15 days',
    8453
), (
    9011,
    1,
    'Active Distribution',
    100000,
    5000,
    2500,
    2500,
    NOW() - INTERVAL '10 seconds',
    NOW() + INTERVAL '1 month',
    1e6::bigint,
    NOW() + INTERVAL '2 months',
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
WHERE number IN (9010, 9011)
ORDER BY number;

-- Create two paid tags for user
INSERT INTO tags (name, status, user_id)
VALUES ('alice', 'confirmed', tests.get_supabase_uid('user1')),
       ('bob', 'confirmed', tests.get_supabase_uid('user1'));

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1')),
    (SELECT id FROM tags WHERE name = 'alice')
), (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1')),
    (SELECT id FROM tags WHERE name = 'bob')
);

-- Create receipts for both tags
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'alice'),
    'alice',
    '100:0:0:0',
    NOW()
), (
    (SELECT id FROM tags WHERE name = 'bob'),
    'bob',
    '101:0:0:0',
    NOW()
);

-- Create verifications for both distributions for tag 'alice'
INSERT INTO distribution_verifications (
    distribution_id,
    user_id,
    type,
    metadata,
    weight,
    created_at
) VALUES (
    (SELECT id FROM distributions WHERE number = 9010 ORDER BY id DESC LIMIT 1),
    tests.get_supabase_uid('user1'),
    'tag_registration',
    jsonb_build_object('tag', 'alice'),
    4,
    NOW()
), (
    (SELECT id FROM distributions WHERE number = 9011 ORDER BY id DESC LIMIT 1),
    tests.get_supabase_uid('user1'),
    'tag_registration',
    jsonb_build_object('tag', 'alice'),
    4,
    NOW()
);

SET ROLE postgres;

-- Test 1: Verifications exist for both distributions before deletion
-- We expect at least 2 (one for each distribution we created)
SELECT ok(
    (SELECT COUNT(*)
     FROM distribution_verifications
     WHERE user_id = tests.get_supabase_uid('user1')
     AND type = 'tag_registration'
     AND metadata->>'tag' = 'alice') >= 2,
    'Verifications exist for both distributions before deletion'
);

-- Delete the tag (as service_role to test the trigger logic directly)
SET ROLE service_role;
DELETE FROM send_account_tags
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
AND tag_id = (SELECT id FROM tags WHERE name = 'alice');
SET ROLE postgres;

-- Test 2: Active distribution verification is deleted
SELECT ok(
    NOT EXISTS(
        SELECT 1
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE dv.user_id = tests.get_supabase_uid('user1')
        AND dv.type = 'tag_registration'
        AND dv.metadata->>'tag' = 'alice'
        AND d.number = 9011
    ),
    'Active distribution verification is deleted'
);

-- Test 3: Past distribution verification is preserved
SELECT ok(
    EXISTS(
        SELECT 1
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE dv.user_id = tests.get_supabase_uid('user1')
        AND dv.type = 'tag_registration'
        AND dv.metadata->>'tag' = 'alice'
        AND d.number = 9010
    ),
    'Past distribution verification is preserved'
);

-- Test 4: Re-buying the same tag creates a new verification
SET ROLE service_role;

-- Tag should be available now
UPDATE tags SET user_id = tests.get_supabase_uid('user1'), status = 'confirmed'
WHERE name = 'alice';

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1')),
    (SELECT id FROM tags WHERE name = 'alice')
);

-- Create new receipt for re-purchased tag
-- This will trigger automatic verification creation via insert_verification_tag_registration_from_receipt
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'alice'),
    'alice',
    '200:0:0:0',
    NOW()
);

SET ROLE postgres;

SELECT ok(
    EXISTS(
        SELECT 1
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE dv.user_id = tests.get_supabase_uid('user1')
        AND dv.type = 'tag_registration'
        AND dv.metadata->>'tag' = 'alice'
        AND d.number = 9011
    ),
    'New verification created after re-purchasing tag'
);

SELECT finish();
ROLLBACK;
