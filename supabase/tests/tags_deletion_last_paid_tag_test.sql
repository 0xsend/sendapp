BEGIN;
SELECT plan(4);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Setup test user and send account
SELECT tests.create_supabase_user('user1');

SET ROLE service_role;

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('user1'), '0x1234567890123456789012345678901234567890', 8453, '\\x00');

-- Test 1: User with 1 free tag + 1 paid tag cannot delete the paid tag
-- Register free first sendtag via the proper function (as authenticated user)
SELECT tests.authenticate_as('user1');
SELECT register_first_sendtag('alice', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1')), NULL);
SET ROLE service_role;

-- Create a paid tag @bob
INSERT INTO tags (name, status, user_id)
VALUES ('bob', 'confirmed', tests.get_supabase_uid('user1'));

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1')),
    (SELECT id FROM tags WHERE name = 'bob')
);

-- Create a receipt for the paid tag
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'bob'),
    'bob',
    '100:0:0:0',
    NOW()
);

-- Attempt to delete the paid tag as authenticated user (should fail - it's the last paid tag)
SELECT tests.authenticate_as('user1');
SELECT throws_ok(
    $$ DELETE FROM send_account_tags
       WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
       AND tag_id = (SELECT id FROM tags WHERE name = 'bob') $$,
    'P0001',
    'Cannot delete your last paid sendtag. Users must maintain at least one paid sendtag.',
    'Cannot delete last paid tag when user has free tags'
);

-- Test 2: User can delete paid tag when they have 2+ paid tags
SET ROLE service_role;

-- Add another paid tag @charlie
INSERT INTO tags (name, status, user_id)
VALUES ('charlie', 'confirmed', tests.get_supabase_uid('user1'));

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1')),
    (SELECT id FROM tags WHERE name = 'charlie')
);

-- Create a receipt for the second paid tag
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'charlie'),
    'charlie',
    '101:0:0:0',
    NOW()
);

-- Now deletion should succeed
DELETE FROM send_account_tags
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
AND tag_id = (SELECT id FROM tags WHERE name = 'bob');

SELECT ok(
    NOT EXISTS(
        SELECT 1 FROM send_account_tags sat
        WHERE sat.send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
        AND sat.tag_id = (SELECT id FROM tags WHERE name = 'bob')
    ),
    'Can delete paid tag when user has 2+ paid tags'
);

-- Test 3: User can delete free tag when they have paid tags
DELETE FROM send_account_tags
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
AND tag_id = (SELECT id FROM tags WHERE name = 'alice');

SELECT ok(
    NOT EXISTS(
        SELECT 1 FROM send_account_tags sat
        WHERE sat.send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
        AND sat.tag_id = (SELECT id FROM tags WHERE name = 'alice')
    ),
    'Can delete free tag when user has paid tags'
);

-- Test 4: Free tag doesn't count toward paid tag requirement - cannot delete last paid tag
SELECT tests.authenticate_as('user1');
SELECT throws_ok(
    $$ DELETE FROM send_account_tags
       WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user1'))
       AND tag_id = (SELECT id FROM tags WHERE name = 'charlie') $$,
    'P0001',
    'Cannot delete your last paid sendtag. Users must maintain at least one paid sendtag.',
    'Cannot delete last paid tag even when no free tags remain'
);

SELECT finish();
ROLLBACK;
