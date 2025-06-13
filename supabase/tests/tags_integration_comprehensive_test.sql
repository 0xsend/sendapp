BEGIN;
SELECT plan(12);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts
SELECT tests.create_supabase_user('integration_user1');
SELECT tests.create_supabase_user('integration_user2');

-- Clean up any existing tags from previous test runs to avoid conflicts
DELETE FROM send_account_tags WHERE tag_id IN (
    SELECT id FROM tags WHERE name IN ('integration_tag', 'junction_tag1', 'junction_tag2', 'referral_tag', 'complex_tag', 'alice', 'alice_work')
);
DELETE FROM tags WHERE name IN ('integration_tag', 'junction_tag1', 'junction_tag2', 'referral_tag', 'complex_tag', 'alice', 'alice_work');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('integration_user1'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('integration_user2'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');

-- Create profiles with referral codes
INSERT INTO profiles (id, name, referral_code)
VALUES (tests.get_supabase_uid('integration_user1'), 'Integration User 1', 'REFER1')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, referral_code = EXCLUDED.referral_code;

INSERT INTO profiles (id, name, referral_code)
VALUES (tests.get_supabase_uid('integration_user2'), 'Integration User 2', 'REFER2')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, referral_code = EXCLUDED.referral_code;

-- Test 1-4: Tag confirmation → activity feed → receipt creation (end-to-end)
SELECT tests.authenticate_as('integration_user1');

-- Create a pending tag
SELECT create_tag('integration_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user1')));

-- Get the tag ID and send account ID for receipt creation
SELECT tests.authenticate_as('integration_user1');

-- Test 1: Tag is created and in pending status
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'integration_tag'
    AND t.status = 'pending'
    AND sa.user_id = tests.get_supabase_uid('integration_user1')
), 'Tag created in pending status');

-- Create a mock sendtag checkout receipt for the confirmation
SET ROLE service_role;

-- Insert a sendtag checkout receipt (simulating blockchain payment)
INSERT INTO sendtag_checkout_receipts (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    amount,
    referrer,
    reward,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,  -- Base chain ID
    decode('0000000000000000000000000000000000000000', 'hex'),  -- log_addr
    EXTRACT(EPOCH FROM NOW())::numeric,  -- block_time
    decode('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'hex'),  -- tx_hash
    decode('1111111111111111111111111111111111111111', 'hex'),  -- sender (matches user1's address)
    1000000000000000000::numeric,  -- amount (1 ETH in wei)
    decode('0000000000000000000000000000000000000000', 'hex'),  -- referrer
    0::numeric,  -- reward
    'test_ig',  -- ig_name
    'test_src',  -- src_name
    12345::numeric,  -- block_num
    1,  -- tx_idx
    0,  -- log_idx
    0  -- abi_idx
);

-- Confirm the tag using the receipt (get the actual event_id from the inserted receipt)
SELECT confirm_tags(
    ARRAY['integration_tag']::citext[],
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user1')),
    (SELECT event_id FROM sendtag_checkout_receipts WHERE sender = decode('1111111111111111111111111111111111111111', 'hex') ORDER BY block_time DESC LIMIT 1),
    NULL::text  -- no referral code
);

SET ROLE postgres;

-- Test 2: Tag is now confirmed
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    WHERE t.name = 'integration_tag'
    AND t.status = 'confirmed'
), 'Tag is confirmed after receipt verification');

-- Test 3: Activity feed entry was created for tag confirmation
SELECT ok(EXISTS(
    SELECT 1 FROM activity a
    WHERE a.from_user_id = tests.get_supabase_uid('integration_user1')
    AND a.data->'tags' @> '["integration_tag"]'::jsonb
    AND a.event_name = 'tag_receipt_usdc'
), 'Activity feed entry created for tag confirmation');

-- Test 4: Tag receipt was created linking to the checkout receipt
SELECT ok(EXISTS(
    SELECT 1 FROM tag_receipts tr
    JOIN tags t ON t.id = tr.tag_id
    WHERE t.name = 'integration_tag'
), 'Tag receipt created linking to checkout receipt');

-- Test 5-7: Junction table operations maintain main tag consistency
SELECT tests.authenticate_as('integration_user1');

-- Create additional tags to test junction table operations
SELECT create_tag('junction_tag1', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user1')));
SELECT create_tag('junction_tag2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user1')));

-- Confirm the additional tags using proper process
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name IN ('junction_tag1', 'junction_tag2');

-- Test 5: Main tag is the first confirmed tag (integration_tag)
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('integration_user1')
    AND t.name = 'integration_tag'
), 'Main tag is the first confirmed tag');

-- Delete a non-main tag from junction table
DELETE FROM send_account_tags
WHERE tag_id = (SELECT id FROM tags WHERE name = 'junction_tag1')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user1'));

-- Test 6: Main tag remains unchanged when non-main tag is deleted
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('integration_user1')
    AND t.name = 'integration_tag'
), 'Main tag unchanged when non-main tag deleted');

-- Delete the main tag from junction table
DELETE FROM send_account_tags
WHERE tag_id = (SELECT id FROM tags WHERE name = 'integration_tag')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user1'));

-- Test 7: Main tag succession occurs when main tag is deleted
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('integration_user1')
    AND t.name = 'junction_tag2'
), 'Main tag succession occurs when main tag deleted');

-- Test 8-10: Referral system integration with first tag confirmation
SELECT tests.authenticate_as('integration_user2');

-- Create a tag for user2 with referral
SELECT create_tag('referral_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user2')));

-- Create checkout receipt with referral for user2
SET ROLE service_role;

INSERT INTO sendtag_checkout_receipts (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    amount,
    referrer,
    reward,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,  -- Base chain ID
    decode('0000000000000000000000000000000000000000', 'hex'),  -- log_addr
    EXTRACT(EPOCH FROM NOW())::numeric,  -- block_time
    decode('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00', 'hex'),  -- tx_hash
    decode('2222222222222222222222222222222222222222', 'hex'),  -- sender (matches user2's address)
    1000000000000000000::numeric,  -- amount
    decode('0000000000000000000000000000000000000000', 'hex'),  -- referrer
    0::numeric,  -- reward
    'test_ig2',  -- ig_name
    'test_src2',  -- src_name
    12346::numeric,  -- block_num
    1,  -- tx_idx
    0,  -- log_idx
    0  -- abi_idx
);

-- Confirm tag with referral code (using integration_user1's referral code)
SELECT confirm_tags(
    ARRAY['referral_tag']::citext[],
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user2')),
    (SELECT event_id FROM sendtag_checkout_receipts WHERE sender = decode('2222222222222222222222222222222222222222', 'hex') ORDER BY block_time DESC LIMIT 1),
    'REFER1'::text  -- referral code from user1's profile
);

SET ROLE postgres;

-- Test 8: Referral relationship was created
SELECT ok(EXISTS(
    SELECT 1 FROM referrals r
    WHERE r.referred_id = tests.get_supabase_uid('integration_user2')
    AND r.referrer_id = tests.get_supabase_uid('integration_user1')
), 'Referral relationship created during tag confirmation');

-- Test 9: Tag confirmation with referral creates proper activity entries
SELECT ok(EXISTS(
    SELECT 1 FROM activity a
    WHERE a.from_user_id = tests.get_supabase_uid('integration_user2')
    AND a.data->'tags' @> '["referral_tag"]'::jsonb
    AND a.event_name = 'tag_receipt_usdc'
), 'Activity entry created for tag confirmation with referral');

-- Test 10: Referral activity is also created
SELECT ok(EXISTS(
    SELECT 1 FROM activity a
    WHERE a.from_user_id = tests.get_supabase_uid('integration_user1')
    AND a.to_user_id = tests.get_supabase_uid('integration_user2')
    AND a.event_name = 'referrals'
), 'Referral activity entry created');

-- Test 11: Complex integration scenario - user2 creates and confirms a new tag
SELECT tests.authenticate_as('integration_user2');
SELECT create_tag('complex_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user2')));

-- Confirm it for user2
SET ROLE service_role;

INSERT INTO sendtag_checkout_receipts (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    amount,
    referrer,
    reward,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,  -- Base chain ID
    decode('0000000000000000000000000000000000000000', 'hex'),  -- log_addr
    EXTRACT(EPOCH FROM NOW())::numeric,  -- block_time
    decode('789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123450', 'hex'),  -- tx_hash
    decode('2222222222222222222222222222222222222222', 'hex'),  -- sender (matches user2's address)
    1000000000000000000::numeric,  -- amount
    decode('0000000000000000000000000000000000000000', 'hex'),  -- referrer
    0::numeric,  -- reward
    'test_ig3',  -- ig_name
    'test_src3',  -- src_name
    12347::numeric,  -- block_num
    1,  -- tx_idx
    0,  -- log_idx
    0  -- abi_idx
);

SELECT confirm_tags(
    ARRAY['complex_tag']::citext[],
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('integration_user2')),
    (SELECT event_id FROM sendtag_checkout_receipts WHERE block_num = 12347 LIMIT 1),
    NULL::text
);

-- SET ROLE postgres;

-- SELECT diag('integration_user2: ' || tests.get_supabase_uid('integration_user2')::text);

-- SELECT diag('activity: ' || json_agg(a.*)::text || ' tags: ' || json_agg(a.data->'tags')::text || ' unpacked: ' || json_agg(a.data->'tags' @> '["complex_tag"]'::jsonb)::text)
-- FROM activity a;

-- select diag('tags: ' || json_agg(t.*)::text || ' unpacked: ' || json_agg(t.name)::text)
-- from tags t;

-- Test 11: Complex scenario results in proper ownership and main tag assignment
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'complex_tag'
    AND t.status = 'confirmed'
    AND sa.user_id = tests.get_supabase_uid('integration_user2')
), 'Complex scenario results in proper tag ownership');

-- Test 12: Final integration check - all systems working together
-- Verify both users have proper main tags and activity entries
SELECT ok(
    (SELECT COUNT(*) FROM send_accounts sa
     WHERE sa.main_tag_id IS NOT NULL
     AND sa.user_id IN (tests.get_supabase_uid('integration_user1'), tests.get_supabase_uid('integration_user2'))) = 2,
    'Both users have valid main tags after all operations'
);

SELECT * FROM finish();
ROLLBACK;
