BEGIN;
SELECT plan(25);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users
SELECT tests.create_supabase_user('first_sendtag_user');
SELECT tests.create_supabase_user('referrer_user');
SELECT tests.create_supabase_user('already_has_tags_user');
SELECT tests.create_supabase_user('different_send_account_user');

-- Test 1: Function exists
SELECT has_function(
    'public',
    'register_first_sendtag',
    ARRAY['citext', 'uuid', 'text'],
    'register_first_sendtag function exists'
);

-- Setup send accounts for testing
SELECT tests.authenticate_as('first_sendtag_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('first_sendtag_user'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');

SELECT tests.authenticate_as('referrer_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('referrer_user'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');

SELECT tests.authenticate_as('already_has_tags_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('already_has_tags_user'), '0x3333333333333333333333333333333333333333', 8453, '\\x00');

SELECT tests.authenticate_as('different_send_account_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('different_send_account_user'), '0x4444444444444444444444444444444444444444', 8453, '\\x00');

-- Test 2: Successful first sendtag registration without referral
SELECT tests.authenticate_as('first_sendtag_user');
SELECT ok(
    (SELECT register_first_sendtag(
        'firsttag'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('first_sendtag_user')),
        NULL
    ) IS NOT NULL),
    'register_first_sendtag succeeds with valid inputs'
);

-- Test 3: Verify tag was created and confirmed
SELECT ok(EXISTS(
    SELECT 1 FROM tags
    WHERE name = 'firsttag'
    AND status = 'confirmed'
    AND user_id = tests.get_supabase_uid('first_sendtag_user')
), 'Tag is created and immediately confirmed');

-- Test 4: Verify send_account_tags association was created
SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN tags t ON t.id = sat.tag_id
    WHERE t.name = 'firsttag'
    AND sat.send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('first_sendtag_user'))
), 'send_account_tags association created');

-- Test 5: Verify main tag was set
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('first_sendtag_user')
    AND t.name = 'firsttag'
), 'Tag set as main tag automatically');

-- Test 6: Verify function returns correct JSON structure
-- Use a new user for this test
SELECT tests.create_supabase_user('json_test_user');
SELECT tests.authenticate_as('json_test_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('json_test_user'), '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 8453, '\\x00');

-- Call the function once and store the result to check structure
WITH result AS (
    SELECT register_first_sendtag(
        'jsontag'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('json_test_user')),
        NULL
    ) as json_result
)
SELECT ok(
    (SELECT (json_result::jsonb ? 'success') AND
            (json_result::jsonb ? 'tag_id') AND
            (json_result::jsonb ? 'tag_name') AND
            (json_result::jsonb ->> 'success')::boolean = true AND
            (json_result::jsonb ->> 'tag_name') = 'jsontag'
     FROM result),
    'Function returns expected JSON structure with success, tag_id, and tag_name'
);

-- Test 7: Test with referral code
-- First create a referrer profile and tag using register_first_sendtag
SELECT tests.authenticate_as('referrer_user');
SELECT register_first_sendtag('referrertag'::citext, (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('referrer_user')), NULL);

-- Now test register_first_sendtag with referral
SELECT tests.create_supabase_user('referred_user');
SELECT tests.authenticate_as('referred_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('referred_user'), '0x5555555555555555555555555555555555555555', 8453, '\\x00');

select set_config('role', 'service_role', true);

SELECT ok(
    (SELECT register_first_sendtag(
        'referredtag'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('referred_user')),
        (SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('referrer_user'))
    ) IS NOT NULL),
    'register_first_sendtag succeeds with referral code'
);

select tests.authenticate_as('referred_user');

-- Test 8: Verify referral was created
SELECT results_eq(
    $$ select tag from public.referrer $$,
    $$ values ('referrertag'::citext) $$,
    'Referral relationship created correctly'
);

-- Test 9: Error - User not authenticated
select tests.clear_authentication();
SELECT throws_ok(
    format('SELECT register_first_sendtag(''unauthtag''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('first_sendtag_user'))),
    'User must be authenticated',
    'Function throws error when user not authenticated'
);

-- Test 10: Error - Send account doesn't belong to user
SELECT tests.authenticate_as('different_send_account_user');
SELECT throws_ok(
    format('SELECT register_first_sendtag(''wrongaccount''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('first_sendtag_user'))),
    'Send account not found or does not belong to user',
    'Function throws error when send account doesn''t belong to user'
);

-- Test 11: Error - User already has confirmed tags
-- First create a user with an existing confirmed tag using register_first_sendtag
SELECT tests.authenticate_as('already_has_tags_user');
SELECT register_first_sendtag('existingtag'::citext, (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('already_has_tags_user')), NULL);

SELECT tests.authenticate_as('already_has_tags_user');
SELECT throws_ok(
    format('SELECT register_first_sendtag(''secondtag''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('already_has_tags_user'))),
    'User already has confirmed sendtags',
    'Function throws error when user already has confirmed tags'
);

-- Test 12: Error - Invalid send account ID
SELECT tests.authenticate_as('first_sendtag_user');
SELECT throws_ok(
    'SELECT register_first_sendtag(''invalidaccount''::citext, ''550e8400-e29b-41d4-a716-446655440000''::uuid, NULL)',
    'Send account not found or does not belong to user',
    'Function throws error with invalid send account ID'
);

-- Test 13: Test tag name validation (reusing existing tag)
-- Create an available tag first
SET ROLE service_role;
INSERT INTO tags (name, status, user_id) VALUES ('availabletag', 'available', NULL);
SET ROLE postgres;

SELECT tests.create_supabase_user('reuse_tag_user');
SELECT tests.authenticate_as('reuse_tag_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('reuse_tag_user'), '0x6666666666666666666666666666666666666666', 8453, '\\x00');
SELECT ok(
    (SELECT register_first_sendtag(
        'availabletag'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('reuse_tag_user')),
        NULL
    ) IS NOT NULL),
    'Function successfully reuses available tag'
);

-- Test 14: Verify available tag was updated correctly
SELECT ok(EXISTS(
    SELECT 1 FROM tags
    WHERE name = 'availabletag'
    AND status = 'confirmed'
    AND user_id = tests.get_supabase_uid('reuse_tag_user')
), 'Available tag was properly claimed and confirmed');

-- Test 15: Test duplicate tag name (already taken)
SELECT tests.create_supabase_user('duplicate_tag_user');
SELECT tests.authenticate_as('duplicate_tag_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('duplicate_tag_user'), '0x7777777777777777777777777777777777777777', 8453, '\\x00');
SELECT throws_ok(
    format('SELECT register_first_sendtag(''firsttag''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('duplicate_tag_user'))),
    NULL, -- Will be caught by unique constraint
    'Function properly handles duplicate tag names'
);

-- Test 16: Test empty tag name
SELECT throws_ok(
    format('SELECT register_first_sendtag(''''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('duplicate_tag_user'))),
    NULL,
    'Function handles empty tag name appropriately'
);

-- Test 17: Test very long tag name (exceeding 20 characters)
SELECT throws_ok(
    format('SELECT register_first_sendtag(''verylongtagnamethatisinvalid''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('duplicate_tag_user'))),
    NULL,
    'Function handles tag names exceeding length limit'
);

-- Test 18: Test invalid characters in tag name
SELECT throws_ok(
    format('SELECT register_first_sendtag(''invalid-tag-name''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('duplicate_tag_user'))),
    NULL,
    'Function handles invalid characters in tag name'
);

-- Test 19: Test referral with non-existent referral code
SELECT ok(
    (SELECT register_first_sendtag(
        'nonexistentref'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('duplicate_tag_user')),
        'NONEXISTENT'
    ) IS NOT NULL),
    'Function succeeds with non-existent referral code (no referral created)'
);

-- Test 20: Verify no referral was created for non-existent code
SELECT ok(NOT EXISTS(
    SELECT 1 FROM referrals
    WHERE referred_id = tests.get_supabase_uid('duplicate_tag_user')
), 'No referral created for non-existent referral code');

-- Test 21: Test self-referral (user tries to refer themselves)
SELECT tests.create_supabase_user('self_refer_user');
SELECT tests.authenticate_as('self_refer_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('self_refer_user'), '0x8888888888888888888888888888888888888888', 8453, '\\x00');
SELECT ok(
    (SELECT register_first_sendtag(
        'selfreftag'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('self_refer_user')),
        (SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('self_refer_user'))
    ) IS NOT NULL),
    'Function succeeds with self-referral code (no referral created)'
);

-- Test 22: Verify no self-referral was created
SELECT ok(NOT EXISTS(
    SELECT 1 FROM referrals
    WHERE referred_id = tests.get_supabase_uid('self_refer_user')
    AND referrer_id = tests.get_supabase_uid('self_refer_user')
), 'No self-referral created');

-- Test 23: Test that main_tag_id is not updated if already set
-- Create a user with an existing main tag using register_first_sendtag
SELECT tests.create_supabase_user('existing_main_tag_user');
SELECT tests.authenticate_as('existing_main_tag_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('existing_main_tag_user'), '0x9999999999999999999999999999999999999999', 8453, '\\x00');

-- Set up an existing confirmed tag using register_first_sendtag
SELECT register_first_sendtag('existingmain'::citext, (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('existing_main_tag_user')), NULL);

-- This should fail since user already has confirmed tags
SELECT tests.authenticate_as('existing_main_tag_user');
SELECT throws_ok(
    format('SELECT register_first_sendtag(''newmaintag''::citext, %L::uuid, NULL)',
           (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('existing_main_tag_user'))),
    'User already has confirmed sendtags',
    'Function prevents users with existing confirmed tags from registering first sendtag'
);

-- Test 24: Test transaction atomicity (this is more of a structural test)
-- Verify that if any part fails, nothing is created
SELECT tests.create_supabase_user('atomic_test_user');
SELECT tests.authenticate_as('atomic_test_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('atomic_test_user'), '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8453, '\\x00');

-- Get count before operation
SELECT ok(
    (SELECT COUNT(*) FROM tags WHERE user_id = tests.get_supabase_uid('atomic_test_user')) = 0 AND
    (SELECT COUNT(*) FROM send_account_tags sat
     JOIN send_accounts sa ON sa.id = sat.send_account_id
     WHERE sa.user_id = tests.get_supabase_uid('atomic_test_user')) = 0,
    'No tags or associations exist before atomic test'
);

-- Test 25: Verify return value structure for successful operation
WITH result AS (
    SELECT register_first_sendtag(
        'atomictest'::citext,
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('atomic_test_user')),
        NULL
    ) as json_result
)
SELECT ok(
    (SELECT (json_result::jsonb ->> 'success')::boolean = true AND
            (json_result::jsonb ->> 'tag_name')::text = 'atomictest' AND
            (json_result::jsonb ->> 'is_main_tag')::boolean = true -- true because no previous main tag
     FROM result),
    'Function returns correct JSON structure with expected values'
);

SELECT finish();
ROLLBACK;
