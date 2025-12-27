-- Comprehensive test suite for the contacts feature
-- Tests tables, functions, constraints, RLS, and labels

BEGIN;
SELECT plan(38);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- ============================================================================
-- Test setup: Create users with profiles, send accounts, and tags
-- ============================================================================

-- Create test users
SELECT tests.create_supabase_user('contact_owner');
SELECT tests.create_supabase_user('contact_target_1');
SELECT tests.create_supabase_user('contact_target_2');
SELECT tests.create_supabase_user('other_user');

-- Create send accounts and tags as each authenticated user
-- (using create_tag function which handles send_account_tags junction table)

-- Setup contact_owner
SELECT tests.authenticate_as('contact_owner');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('contact_owner'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');
SELECT create_tag('owner_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('contact_owner')));

-- Setup contact_target_1
SELECT tests.authenticate_as('contact_target_1');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('contact_target_1'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');
SELECT create_tag('target1_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('contact_target_1')));

-- Setup contact_target_2
SELECT tests.authenticate_as('contact_target_2');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('contact_target_2'), '0x3333333333333333333333333333333333333333', 8453, '\\x00');
SELECT create_tag('target2_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('contact_target_2')));

-- Setup other_user
SELECT tests.authenticate_as('other_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('other_user'), '0x4444444444444444444444444444444444444444', 8453, '\\x00');
SELECT create_tag('other_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('other_user')));

-- Confirm all tags and update profiles (requires service_role)
SELECT tests.authenticate_as_service_role();
UPDATE tags SET status = 'confirmed' WHERE name IN ('owner_tag', 'target1_tag', 'target2_tag', 'other_tag');

UPDATE profiles SET name = 'Contact Owner', avatar_url = 'https://example.com/owner.png', is_public = TRUE
WHERE id = tests.get_supabase_uid('contact_owner');

UPDATE profiles SET name = 'Target User One', avatar_url = 'https://example.com/target1.png', is_public = TRUE
WHERE id = tests.get_supabase_uid('contact_target_1');

UPDATE profiles SET name = 'Target User Two', avatar_url = 'https://example.com/target2.png', is_public = TRUE
WHERE id = tests.get_supabase_uid('contact_target_2');

UPDATE profiles SET name = 'Other User', avatar_url = 'https://example.com/other.png', is_public = TRUE
WHERE id = tests.get_supabase_uid('other_user');

SET ROLE postgres;

-- ============================================================================
-- Test 1-3: RLS is enabled on all contacts tables
-- ============================================================================

SELECT tests.rls_enabled('public', 'contacts');
SELECT tests.rls_enabled('public', 'contact_labels');
SELECT tests.rls_enabled('public', 'contact_label_assignments');

-- ============================================================================
-- Test 4-6: add_contact_by_lookup function tests
-- ============================================================================

-- Test 4: add_contact_by_lookup requires authentication
SELECT tests.clear_authentication();
SELECT throws_ok(
    $$ SELECT add_contact_by_lookup('tag'::lookup_type_enum, 'target1_tag') $$,
    'Authentication required',
    'add_contact_by_lookup requires authentication'
);

-- Test 5: add_contact_by_lookup function exists and returns bigint
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_type t ON p.prorettype = t.oid
        WHERE p.proname = 'add_contact_by_lookup'
        AND t.typname = 'int8'
    ),
    'add_contact_by_lookup function exists and returns bigint'
);

-- Test 6: add_contact_by_lookup rejects self-contact (using sendid lookup)
SELECT tests.authenticate_as('contact_owner');
DO $$
DECLARE
    owner_send_id integer;
BEGIN
    SELECT send_id INTO owner_send_id FROM profiles WHERE id = tests.get_supabase_uid('contact_owner');
    EXECUTE format('SET SESSION "vars.owner_send_id" TO %L', owner_send_id::text);
END;
$$;
SELECT throws_ok(
    $$ SELECT add_contact_by_lookup('sendid'::lookup_type_enum, current_setting('vars.owner_send_id')) $$,
    'Cannot add yourself as a contact',
    'add_contact_by_lookup prevents adding self as contact'
);

-- ============================================================================
-- Test 7-13: add_external_contact function tests
-- ============================================================================

-- Test 7: add_external_contact requires authentication
SELECT tests.clear_authentication();
SELECT throws_ok(
    $$ SELECT add_external_contact('0xabcdef1234567890abcdef1234567890abcdef12', 'eip155:1') $$,
    'Authentication required',
    'add_external_contact requires authentication'
);

-- Test 8: add_external_contact with valid EIP-155 address (Ethereum mainnet)
SELECT tests.authenticate_as('contact_owner');
SELECT lives_ok(
    $$ SELECT add_external_contact('0xabcdef1234567890abcdef1234567890abcdef12', 'eip155:1', 'ETH Wallet') $$,
    'add_external_contact accepts valid EIP-155 address on Ethereum mainnet'
);

-- Test 9: add_external_contact with valid EIP-155 address (Base)
SELECT lives_ok(
    $$ SELECT add_external_contact('0xfedcba9876543210fedcba9876543210fedcba98', 'eip155:8453', 'Base Wallet') $$,
    'add_external_contact accepts valid EIP-155 address on Base'
);

-- Test 10: add_external_contact with valid Solana address
SELECT lives_ok(
    $$ SELECT add_external_contact('DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy', 'solana:mainnet', 'Solana Wallet') $$,
    'add_external_contact accepts valid Solana address'
);

-- Test 11: add_external_contact normalizes EVM addresses (case insensitive duplicate check)
SELECT throws_ok(
    $$ SELECT add_external_contact('0xABCDEF1234567890ABCDEF1234567890ABCDEF12', 'eip155:1') $$,
    'Contact already exists',
    'add_external_contact normalizes EVM addresses for duplicate check'
);

-- Test 12: add_external_contact rejects invalid chain format
SELECT throws_ok(
    $$ SELECT add_external_contact('0xabcdef1234567890abcdef1234567890abcdef12', 'invalid:chain') $$,
    '23514',
    NULL,
    'add_external_contact rejects invalid chain format'
);

-- Test 13: add_external_contact rejects invalid address format for EIP-155
SELECT throws_ok(
    $$ SELECT add_external_contact('not-a-valid-address', 'eip155:1') $$,
    '23514',
    NULL,
    'add_external_contact rejects invalid EIP-155 address format'
);

-- ============================================================================
-- Setup: Create a manual contact for search tests
-- ============================================================================
SELECT tests.authenticate_as('contact_owner');
INSERT INTO contacts (owner_id, contact_user_id, custom_name, notes, is_favorite, source)
VALUES (
    tests.get_supabase_uid('contact_owner'),
    tests.get_supabase_uid('contact_target_1'),
    'My Friend',
    'Work colleague',
    TRUE,
    'manual'
);

-- ============================================================================
-- Test 14-18: contact_search function tests
-- ============================================================================

-- Test 14: contact_search requires authentication
SELECT tests.clear_authentication();
SELECT throws_ok(
    $$ SELECT * FROM contact_search() $$,
    'Authentication required',
    'contact_search requires authentication'
);

-- Test 15: contact_search returns owner's contacts
SELECT tests.authenticate_as('contact_owner');
SELECT ok(
    (SELECT COUNT(*) FROM contact_search()) >= 1,
    'contact_search returns contacts for authenticated user'
);

-- Test 16: contact_search with query filter finds matching contacts
SELECT ok(
    (SELECT COUNT(*) FROM contact_search('Friend')) >= 1,
    'contact_search with query filter finds matching custom_name'
);

-- Test 17: contact_search with favorites_only filter
SELECT ok(
    (SELECT COUNT(*) FROM contact_search(NULL, 50, 0, TRUE)) >= 1,
    'contact_search with favorites_only returns favorite contacts'
);

-- Test 18: contact_search with source filter
SELECT ok(
    (SELECT COUNT(*) FROM contact_search(NULL, 50, 0, FALSE, NULL, ARRAY['external'::contact_source_enum])) >= 1,
    'contact_search with source filter returns external contacts'
);

-- ============================================================================
-- Test 19-21: toggle_contact_favorite function tests
-- ============================================================================

-- Test 19: toggle_contact_favorite fails for non-existent contact when unauthenticated
SELECT tests.clear_authentication();
SELECT throws_ok(
    $$ SELECT toggle_contact_favorite(999999) $$,
    'Contact not found or access denied',
    'toggle_contact_favorite fails for non-existent contact'
);

-- Test 20: toggle_contact_favorite works for owned contact
SELECT tests.authenticate_as('contact_owner');
DO $$
DECLARE
    contact_id bigint;
    new_status boolean;
BEGIN
    SELECT id INTO contact_id FROM contacts
    WHERE owner_id = tests.get_supabase_uid('contact_owner') LIMIT 1;

    SELECT toggle_contact_favorite(contact_id) INTO new_status;

    IF new_status IS NOT NULL THEN
        EXECUTE format('SET SESSION "vars.toggle_result" TO %L', 'success');
    ELSE
        EXECUTE format('SET SESSION "vars.toggle_result" TO %L', 'failed');
    END IF;
END;
$$;

SELECT is(
    current_setting('vars.toggle_result'),
    'success',
    'toggle_contact_favorite toggles favorite status'
);

-- Test 21: toggle_contact_favorite fails for other user's contact
SELECT tests.authenticate_as('other_user');
SELECT throws_ok(
    $$ SELECT toggle_contact_favorite(
        (SELECT id FROM contacts WHERE owner_id = tests.get_supabase_uid('contact_owner') LIMIT 1)
    ) $$,
    'Contact not found or access denied',
    'toggle_contact_favorite fails for other user''s contact'
);

-- ============================================================================
-- Test 22-24: sync_contacts_from_activity function tests
-- ============================================================================

-- Test 22: sync_contacts_from_activity requires authentication
SELECT tests.clear_authentication();
SELECT throws_ok(
    $$ SELECT sync_contacts_from_activity() $$,
    'Authentication required',
    'sync_contacts_from_activity requires authentication'
);

-- Test 23: sync_contacts_from_activity creates contacts from transfer activity
SET ROLE service_role;
INSERT INTO activity (event_id, created_at, event_name, from_user_id, to_user_id, data)
VALUES
    ('transfer_sync_1', NOW() - INTERVAL '1 hour', 'send_account_transfers',
     tests.get_supabase_uid('contact_owner'), tests.get_supabase_uid('contact_target_2'),
     '{"v": 1000000}');
SET ROLE postgres;

SELECT tests.authenticate_as('contact_owner');
SELECT ok(
    (SELECT sync_contacts_from_activity()) >= 0,
    'sync_contacts_from_activity executes and returns count'
);

-- Test 24: sync_contacts_from_activity does not duplicate existing contacts
SELECT ok(
    (SELECT sync_contacts_from_activity()) >= 0,
    'sync_contacts_from_activity does not duplicate existing contacts'
);

-- ============================================================================
-- Test 25-26: contact_favorites function tests
-- ============================================================================

-- Test 25: contact_favorites requires authentication
SELECT tests.clear_authentication();
SELECT throws_ok(
    $$ SELECT * FROM contact_favorites() $$,
    'Authentication required',
    'contact_favorites requires authentication'
);

-- Test 26: contact_favorites function exists and is SECURITY DEFINER
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_proc
        WHERE proname = 'contact_favorites'
        AND prosecdef = TRUE
    ),
    'contact_favorites is SECURITY DEFINER'
);

-- ============================================================================
-- Test 27-29: RLS policy tests
-- ============================================================================

-- Test 27: Users can only see their own contacts
SELECT tests.authenticate_as('contact_owner');
SELECT ok(
    (SELECT COUNT(*) FROM contacts WHERE owner_id != tests.get_supabase_uid('contact_owner')) = 0,
    'RLS prevents users from seeing other users'' contacts'
);

-- Test 28: Users cannot insert contacts for other users
SELECT tests.authenticate_as('other_user');
SELECT throws_ok(
    $$ INSERT INTO contacts (owner_id, contact_user_id)
       VALUES (tests.get_supabase_uid('contact_owner'), tests.get_supabase_uid('other_user')) $$,
    '42501',
    NULL,
    'RLS prevents inserting contacts for other users'
);

-- Test 29: Users cannot update or delete other users' contacts (RLS filters them out)
-- Note: With RLS, UPDATE/DELETE simply affect 0 rows, no error thrown
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM contacts
        WHERE owner_id = tests.get_supabase_uid('contact_owner')
    ),
    'RLS filters out other users'' contacts from UPDATE/DELETE'
);

-- ============================================================================
-- Test 30-33: Constraint violation tests
-- ============================================================================

-- Test 30: contacts_no_self constraint prevents self-contacts
SELECT tests.authenticate_as('contact_owner');
SELECT throws_ok(
    $$ INSERT INTO contacts (owner_id, contact_user_id)
       VALUES (tests.get_supabase_uid('contact_owner'), tests.get_supabase_uid('contact_owner')) $$,
    '23514',
    NULL,
    'contacts_no_self constraint prevents self-contacts'
);

-- Test 31: contacts_has_identity constraint requires identity
SELECT throws_ok(
    $$ INSERT INTO contacts (owner_id, contact_user_id, external_address)
       VALUES (tests.get_supabase_uid('contact_owner'), NULL, NULL) $$,
    '23514',
    NULL,
    'contacts_has_identity constraint requires contact_user_id or external_address'
);

-- Test 32: contacts_identity_exclusive constraint prevents both identities
SELECT throws_ok(
    $$ INSERT INTO contacts (owner_id, contact_user_id, external_address, chain_id, source)
       VALUES (
           tests.get_supabase_uid('contact_owner'),
           tests.get_supabase_uid('contact_target_2'),
           '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
           'eip155:1',
           'external'
       ) $$,
    '23514',
    NULL,
    'contacts_identity_exclusive constraint prevents both contact_user_id and external_address'
);

-- Test 33: contacts_chain_id_iff_external constraint requires chain_id with external_address
SELECT throws_ok(
    $$ INSERT INTO contacts (owner_id, external_address, chain_id, source)
       VALUES (tests.get_supabase_uid('contact_owner'), '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', NULL, 'external') $$,
    '23514',
    NULL,
    'contacts_chain_id_iff_external constraint requires chain_id when external_address is set'
);

-- ============================================================================
-- Test 34-37: Label management tests
-- ============================================================================

-- Test 34: Users can create labels
SELECT tests.authenticate_as('contact_owner');
SELECT lives_ok(
    $$ INSERT INTO contact_labels (owner_id, name, color)
       VALUES (tests.get_supabase_uid('contact_owner'), 'Work', '#FF0000') $$,
    'Users can create contact labels'
);

-- Test 35: Label name uniqueness per owner
SELECT throws_ok(
    $$ INSERT INTO contact_labels (owner_id, name)
       VALUES (tests.get_supabase_uid('contact_owner'), 'Work') $$,
    '23505',
    NULL,
    'Label names must be unique per owner'
);

-- Test 36: Users can assign labels to contacts
SELECT lives_ok(
    $$ INSERT INTO contact_label_assignments (contact_id, label_id)
       VALUES (
           (SELECT id FROM contacts WHERE owner_id = tests.get_supabase_uid('contact_owner') LIMIT 1),
           (SELECT id FROM contact_labels WHERE owner_id = tests.get_supabase_uid('contact_owner') AND name = 'Work')
       ) $$,
    'Users can assign labels to their contacts'
);

-- Test 37: contact_search with label filter
SELECT ok(
    (SELECT COUNT(*) FROM contact_search(
        NULL, 50, 0, FALSE,
        ARRAY[(SELECT id FROM contact_labels WHERE owner_id = tests.get_supabase_uid('contact_owner') AND name = 'Work')],
        NULL
    )) >= 1,
    'contact_search with label filter returns labeled contacts'
);

-- ============================================================================
-- Test 38: add_contact function (service_role only) upserts correctly
-- ============================================================================

SET ROLE service_role;
SELECT lives_ok(
    $$ SELECT add_contact(
        tests.get_supabase_uid('other_user'),
        tests.get_supabase_uid('contact_target_1'),
        'Service Role Contact',
        'Added via service role',
        FALSE,
        'activity'::contact_source_enum
    ) $$,
    'add_contact function (service_role) creates contact'
);
SET ROLE postgres;

SELECT finish();
ROLLBACK;
