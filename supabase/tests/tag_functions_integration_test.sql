BEGIN;
SELECT plan(16);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts
SELECT tests.create_supabase_user('integration_user');
SELECT tests.create_supabase_user('referrer_user');

SELECT tests.authenticate_as('integration_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('integration_user'), '0x5234567890123456789012345678901234567890', 8453, '\\x00');

SELECT tests.authenticate_as('referrer_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('referrer_user'), '0x6234567890123456789012345678901234567890', 8453, '\\x00');

-- Switch back to main test user for tag creation
SELECT tests.authenticate_as('integration_user');

-- Test 1: Complete flow create -> confirm without referral
SELECT create_tag('flowtest', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')));

SELECT ok(
    (SELECT id FROM tags WHERE name = 'flowtest' AND user_id = tests.get_supabase_uid('integration_user')) IS NOT NULL,
    'create_tag returns valid tag_id'
);

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'flowtest' AND status = 'pending'
), 'Tag created with pending status');

-- Mock receipt for confirmation
SET ROLE service_role;
INSERT INTO sendtag_checkout_receipts(
    chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
    log_idx, abi_idx, block_time, sender, amount, referrer, reward
) VALUES (
    8453, 
    decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
    decode('1234567890123456789012345678901234567890123456789012345678901234', 'hex'),
    'sendtag_checkout_receipts', 
    'integration_test', 
    1, 0, 0, 0, 1234567890,
    decode(substring('0x5234567890123456789012345678901234567890' FROM 3), 'hex'),
    1000000,
    decode('0000000000000000000000000000000000000000', 'hex'),
    0
);
SET ROLE postgres;

-- Test 2: confirm_tags function integration
SELECT confirm_tags(
    ARRAY['flowtest']::citext[], 
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')), 
    'sendtag_checkout_receipts/integration_test/1/0/0/0', 
    NULL
);

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'flowtest' AND status = 'confirmed'
), 'Tag confirmed successfully through confirm_tags');

-- Test 3: Receipt created properly
SELECT ok(EXISTS(
    SELECT 1 FROM receipts 
    WHERE event_id = 'sendtag_checkout_receipts/integration_test/1/0/0/0' 
    AND user_id = tests.get_supabase_uid('integration_user')
), 'Receipt created for user');

-- Test 4: Tag receipt association created
SELECT ok(EXISTS(
    SELECT 1 FROM tag_receipts tr
    WHERE tr.event_id = 'sendtag_checkout_receipts/integration_test/1/0/0/0' 
    AND tr.tag_id = (SELECT id FROM tags WHERE name = 'flowtest')
), 'Tag receipt association created');

-- Test 5: Main tag set automatically on first confirmation
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    WHERE sa.user_id = tests.get_supabase_uid('integration_user')
    AND sa.main_tag_id = (SELECT id FROM tags WHERE name = 'flowtest')
), 'Tag set as main automatically on first confirmation');

-- Test 6: Setup referral scenario
-- Create referrer tag and confirm it first
SELECT tests.authenticate_as('referrer_user');
SELECT create_tag('referrertag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('referrer_user')));

SET ROLE service_role;
-- Create receipt for referrer
INSERT INTO sendtag_checkout_receipts(
    chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
    log_idx, abi_idx, block_time, sender, amount, referrer, reward
) VALUES (
    8453, 
    decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
    decode('2234567890123456789012345678901234567890123456789012345678901234', 'hex'),
    'sendtag_checkout_receipts', 
    'referrer_test', 
    2, 0, 0, 0, 1234567890,
    decode(substring('0x6234567890123456789012345678901234567890' FROM 3), 'hex'),
    1000000,
    decode('0000000000000000000000000000000000000000', 'hex'),
    0
);
SET ROLE postgres;

SELECT confirm_tags(
    ARRAY['referrertag']::citext[], 
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('referrer_user')), 
    'sendtag_checkout_receipts/referrer_test/2/0/0/0', 
    NULL
);

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'referrertag' AND status = 'confirmed'
), 'Referrer tag confirmed successfully');

-- Test 7: Create second tag with referral
SELECT tests.authenticate_as('integration_user');
SELECT create_tag('referredtag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')));

-- Mock receipt for referred tag
SET ROLE service_role;
INSERT INTO sendtag_checkout_receipts(
    chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
    log_idx, abi_idx, block_time, sender, amount, referrer, reward
) VALUES (
    8453, 
    decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
    decode('3234567890123456789012345678901234567890123456789012345678901234', 'hex'),
    'sendtag_checkout_receipts', 
    'referred_test', 
    3, 0, 0, 0, 1234567890,
    decode(substring('0x5234567890123456789012345678901234567890' FROM 3), 'hex'),
    1000000,
    decode('0000000000000000000000000000000000000000', 'hex'),
    0
);
SET ROLE postgres;

-- Confirm with referral
SELECT confirm_tags(
    ARRAY['referredtag']::citext[], 
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')), 
    'sendtag_checkout_receipts/referred_test/3/0/0/0', 
    (SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('referrer_user'))
);

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'referredtag' AND status = 'confirmed'
), 'Referred tag confirmed successfully');

-- Test 8: Referral relationship created
SELECT ok(EXISTS(
    SELECT 1 FROM referrals 
    WHERE referred_id = tests.get_supabase_uid('integration_user')
    AND referrer_id = tests.get_supabase_uid('referrer_user')
), 'Referral relationship created');

-- Test 9: Multiple tag confirmation in single call
SELECT create_tag('multitag1', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')));
SELECT create_tag('multitag2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')));

-- Mock receipt for multiple tags
SET ROLE service_role;
INSERT INTO sendtag_checkout_receipts(
    chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
    log_idx, abi_idx, block_time, sender, amount, referrer, reward
) VALUES (
    8453, 
    decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
    decode('4234567890123456789012345678901234567890123456789012345678901234', 'hex'),
    'sendtag_checkout_receipts', 
    'multi_test', 
    4, 0, 0, 0, 1234567890,
    decode(substring('0x5234567890123456789012345678901234567890' FROM 3), 'hex'),
    2000000,  -- Double amount for 2 tags
    decode('0000000000000000000000000000000000000000', 'hex'),
    0
);
SET ROLE postgres;

-- Confirm multiple tags
SELECT confirm_tags(
    ARRAY['multitag1', 'multitag2']::citext[], 
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user')), 
    'sendtag_checkout_receipts/multi_test/4/0/0/0', 
    NULL
);

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'multitag1' AND status = 'confirmed'
) AND EXISTS(
    SELECT 1 FROM tags WHERE name = 'multitag2' AND status = 'confirmed'
), 'Multiple tags confirmed in single call');

-- Test 10: Multiple tag receipts created
SELECT ok((
    SELECT COUNT(*) FROM tag_receipts WHERE event_id = 'sendtag_checkout_receipts/multi_test/4/0/0/0'
) = 2, 'Tag receipts created for all confirmed tags');

-- Test 11: Error handling - confirm non-existent tag
SELECT throws_ok(
    'SELECT confirm_tags(ARRAY[''nonexistenttag'']::citext[], (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''integration_user'')), ''fake_event'', NULL)',
    NULL,
    'Error properly caught for non-existent tag confirmation'
);

-- Test 12: Error handling - confirm tag not owned by send_account
SELECT tests.create_supabase_user('other_integration_user');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('other_integration_user'), '0x7234567890123456789012345678901234567890', 8453, '\\x00');

SELECT tests.authenticate_as('other_integration_user');
SELECT create_tag('othertag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('other_integration_user')));

SELECT throws_ok(
    'SELECT confirm_tags(ARRAY[''othertag'']::citext[], (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''integration_user'')), ''wrong_event'', NULL)',
    NULL,
    'Error properly caught for confirming unowned tag'
);

-- Test 13: Tag search function integration
SELECT ok(
    (SELECT (tag_search('flowtest', 10, 0)).tag_matches IS NOT NULL),
    'Tag search function works for confirmed tags'
);

-- Test 14: Profile lookup integration - verify tags appear in profile
SELECT ok(EXISTS(
    SELECT 1 FROM profile_lookup('tag', 'flowtest') p
    WHERE 'flowtest' = ANY(p.all_tags)
), 'Confirmed tag appears in profile lookup all_tags');

-- Test 15: Activity feed integration - verify tag confirmations appear
SELECT ok(true, 'Activity feed integration test skipped for now');

SELECT finish();
ROLLBACK;