BEGIN;
SELECT plan(2);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Setup test users
SELECT tests.create_supabase_user('user_a');
SELECT tests.create_supabase_user('user_b');

SET ROLE service_role;

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

-- User A buys tag @alice
INSERT INTO tags (name, status, user_id)
VALUES ('alice', 'confirmed', tests.get_supabase_uid('user_a'));

INSERT INTO send_account_tags (send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('user_a')),
    (SELECT id FROM tags WHERE name = 'alice')
);

-- Create receipt for User A's tag (older receipt, id will be lower)
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'alice'),
    'alice',
    '100:0:0:0',
    NOW() - INTERVAL '1 day'
);

-- Test 1: User A's receipt exists and is the latest (only one so far)
SELECT ok(
    EXISTS(
        SELECT 1
        FROM tags t
        JOIN tag_receipts tr ON tr.tag_name = t.name
        WHERE t.user_id = tests.get_supabase_uid('user_a')
        AND t.name = 'alice'
        AND tr.id = (
            SELECT MAX(id)
            FROM tag_receipts
            WHERE tag_name = 'alice'
        )
    ),
    'User A has the latest receipt for tag alice'
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

-- Create NEW receipt for User B's tag (newer receipt, id will be higher)
INSERT INTO tag_receipts (tag_id, tag_name, event_id, created_at)
VALUES (
    (SELECT id FROM tags WHERE name = 'alice'),
    'alice',
    '200:0:0:0',
    NOW()
);

-- Test 2: Only User B's receipt matches with MAX(id) - User A's old receipt is excluded
SELECT ok(
    EXISTS(
        SELECT 1
        FROM tags t
        JOIN tag_receipts tr ON tr.tag_name = t.name
        WHERE t.user_id = tests.get_supabase_uid('user_b')
        AND t.name = 'alice'
        AND tr.id = (
            SELECT MAX(id)
            FROM tag_receipts
            WHERE tag_name = 'alice'
        )
    )
    AND NOT EXISTS(
        SELECT 1
        FROM tags t
        JOIN tag_receipts tr ON tr.tag_name = t.name
        WHERE t.user_id = tests.get_supabase_uid('user_a')
        AND tr.id = (
            SELECT MAX(id)
            FROM tag_receipts
            WHERE tag_name = 'alice'
        )
    ),
    'After tag recycling, only User B (current owner) matches MAX(id) receipt logic'
);

SET ROLE postgres;

SELECT finish();
ROLLBACK;
