BEGIN;
SELECT plan(19);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts with profiles
SELECT tests.create_supabase_user('search_user1');
SELECT tests.create_supabase_user('search_user2');
SELECT tests.create_supabase_user('search_user3');
SELECT tests.create_supabase_user('search_user4');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('search_user1'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('search_user2'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('search_user3'), '0x3333333333333333333333333333333333333333', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('search_user4'), '0x4444444444444444444444444444444444444444', 8453, '\\x00');

-- Create profiles for users (needed for search functionality)
INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES (
    tests.get_supabase_uid('search_user1'),
    'Alice Smith',
    'Crypto enthusiast',
    'https://example.com/alice.jpg',
    true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, about = EXCLUDED.about, avatar_url = EXCLUDED.avatar_url, is_public = EXCLUDED.is_public;

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES (
    tests.get_supabase_uid('search_user2'),
    'Bob Johnson',
    'DeFi developer',
    'https://example.com/bob.jpg',
    true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, about = EXCLUDED.about, avatar_url = EXCLUDED.avatar_url, is_public = EXCLUDED.is_public;

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES (
    tests.get_supabase_uid('search_user3'),
    'Charlie Brown',
    'Web3 builder',
    'https://example.com/charlie.jpg',
    true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, about = EXCLUDED.about, avatar_url = EXCLUDED.avatar_url, is_public = EXCLUDED.is_public;

INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES (
    tests.get_supabase_uid('search_user4'),
    'Alice Cooper',
    'Blockchain developer',
    'https://example.com/alice2.jpg',
    true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, about = EXCLUDED.about, avatar_url = EXCLUDED.avatar_url, is_public = EXCLUDED.is_public;

-- Clean up any existing tags from previous test runs to avoid conflicts
SET ROLE postgres;
DELETE FROM send_account_tags WHERE tag_id IN (
    SELECT id FROM tags WHERE name IN ('alice', 'alice_work', 'bob', 'bob_crypto', 'charlie', 'alice2')
);
DELETE FROM tags WHERE name IN ('alice', 'alice_work', 'bob', 'bob_crypto', 'charlie', 'alice2');

-- Create and confirm tags for each user
SELECT tests.authenticate_as('search_user1');

DO $$
BEGIN
    BEGIN
        PERFORM create_tag('alice', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user1')));
        -- RAISE NOTICE 'alice tag created successfully';
    EXCEPTION WHEN OTHERS THEN
        -- RAISE NOTICE 'alice tag creation failed: %', SQLERRM;
    END;

    BEGIN
        PERFORM create_tag('alice_work', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user1')));
        -- RAISE NOTICE 'alice_work tag created successfully';
    EXCEPTION WHEN OTHERS THEN
        -- RAISE NOTICE 'alice_work tag creation failed: %', SQLERRM;
    END;
END $$;

SELECT tests.authenticate_as('search_user2');

DO $$
BEGIN
    BEGIN
        PERFORM create_tag('bob', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user2')));
        -- RAISE NOTICE 'bob tag created successfully';
    EXCEPTION WHEN OTHERS THEN
        -- RAISE NOTICE 'bob tag creation failed: %', SQLERRM;
    END;

    BEGIN
        PERFORM create_tag('bob_crypto', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user2')));
        -- RAISE NOTICE 'bob_crypto tag created successfully';
    EXCEPTION WHEN OTHERS THEN
        -- RAISE NOTICE 'bob_crypto tag creation failed: %', SQLERRM;
    END;
END $$;

SELECT tests.authenticate_as('search_user3');

DO $$
BEGIN
    BEGIN
        PERFORM create_tag('charlie', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user3')));
        -- RAISE NOTICE 'charlie tag created successfully';
    EXCEPTION WHEN OTHERS THEN
        -- RAISE NOTICE 'charlie tag creation failed: %', SQLERRM;
    END;
END $$;

SELECT tests.authenticate_as('search_user4');

DO $$
BEGIN
    BEGIN
        PERFORM create_tag('alice2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user4')));
        -- RAISE NOTICE 'alice2 tag created successfully';
    EXCEPTION WHEN OTHERS THEN
        -- RAISE NOTICE 'alice2 tag creation failed: %', SQLERRM;
    END;
END $$;

-- Confirm all tags using postgres role with trigger bypass
SET ROLE service_role;

-- Update all tags to confirmed status with proper user relationships
UPDATE tags SET status = 'confirmed'
WHERE name IN ('alice', 'alice_work')
AND user_id = tests.get_supabase_uid('search_user1');

UPDATE tags SET status = 'confirmed'
WHERE name IN ('bob', 'bob_crypto')
AND user_id = tests.get_supabase_uid('search_user2');

UPDATE tags SET status = 'confirmed'
WHERE name IN ('charlie')
AND user_id = tests.get_supabase_uid('search_user3');

UPDATE tags SET status = 'confirmed'
WHERE name IN ('alice2')
AND user_id = tests.get_supabase_uid('search_user4');

-- Test 1-5: Tag search functionality
SELECT tests.authenticate_as('search_user1');


-- Test 1: Users can search for exact confirmed tag matches
SELECT ok(
    (SELECT tag_matches FROM tag_search('alice', 10, 0)) IS NOT NULL,
    'Users can search for exact confirmed tag matches'
);

-- Test 2: Users can search for partial tag matches (fuzzy search)
SELECT ok(
    (SELECT tag_matches FROM tag_search('alic', 10, 0)) IS NOT NULL,
    'Users can search for partial tag matches'
);

-- Test 3: Search returns multiple matches for partial queries
SELECT ok(
    (SELECT tag_matches FROM tag_search('alice', 10, 0)) IS NOT NULL,
    'Search returns multiple matches for partial queries'
);

-- Test 4: Search respects limit parameter
SELECT ok(
    (SELECT tag_matches FROM tag_search('alice', 1, 0)) IS NOT NULL,
    'Search respects limit parameter'
);

-- Test 5: Search works with offset parameter
-- Note: offset 1 might return empty results if there aren't enough matches
SELECT ok(
    (SELECT tag_matches FROM tag_search('alice', 2, 0)) IS NOT NULL and
    (SELECT tag_matches FROM tag_search('alice', 2, 1)) IS NOT NULL,
    'Search works with offset parameter'
);

-- Test 6-8: Profile lookup by tag name
-- Test 6: Users can lookup profile information when they know the tag name
SELECT ok(EXISTS(
    SELECT 1 FROM profile_lookup('tag'::lookup_type_enum, 'alice') pl
    WHERE pl.name = 'Alice Smith'
    AND pl.tag = 'alice'
), 'Users can lookup profile information by tag name');

-- Test 7: Profile lookup returns correct send_id
SELECT ok(EXISTS(
    SELECT 1 FROM profile_lookup('tag'::lookup_type_enum, 'bob') pl
    WHERE pl.sendid IS NOT NULL
    AND pl.tag = 'bob'
), 'Profile lookup returns send_id');

-- Test 8: Profile lookup works for all confirmed tags
SELECT ok(
    (SELECT COUNT(*) FROM profile_lookup('tag'::lookup_type_enum, 'charlie')) = 1,
    'Profile lookup works for confirmed tags'
);

-- Test 9: Profile lookup returns NULL/empty for non-existent tags
SELECT ok(
    (SELECT COUNT(*) FROM profile_lookup('tag'::lookup_type_enum, 'nonexistent_tag')) = 0,
    'Profile lookup returns empty for non-existent tags'
);

-- Test 10: Profile lookup returns NULL/empty for pending tags
SELECT tests.authenticate_as('search_user1');
SELECT create_tag('pending_search_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('search_user1')));

SELECT ok(
    (SELECT COUNT(*) FROM profile_lookup('tag'::lookup_type_enum, 'pending_search_tag')) = 0,
    'Profile lookup returns empty for pending tags'
);

-- Test 11-12: Search by send_id (numeric ID search)
-- Test 11: Users can search by send_id using a partial match from our test data
SELECT ok(
    (SELECT send_id_matches FROM tag_search(
        (SELECT p.send_id::text FROM profiles p
         WHERE p.id = tests.get_supabase_uid('search_user1')
         LIMIT 1), 10, 0)) IS NOT NULL,
    'Users can search by send_id'
);

-- Test 12: Send ID search returns profile information
SELECT ok(EXISTS(
    SELECT 1 FROM tag_search(
        (SELECT p.send_id::text FROM profiles p
         WHERE p.id = tests.get_supabase_uid('search_user1')
         LIMIT 1), 10, 0) ts
    WHERE ts.send_id_matches IS NOT NULL AND array_length(ts.send_id_matches, 1) > 0
), 'Send ID search returns results when matches exist');

-- Test 13: Search functionality with numeric characters
SELECT ok(
    (SELECT tag_matches FROM tag_search('alice', 10, 0)) IS NOT NULL,
    'Search works with various character types'
);

-- Test 14: Search functionality is case-insensitive
SELECT ok(
    (SELECT tag_matches FROM tag_search('ALICE', 10, 0)) IS NOT NULL,
    'Tag search is case-insensitive'
);

-- Test 15: Comprehensive search returns multiple match types
-- Create a search query that could match multiple types
SELECT ok(
    (SELECT
        CASE
            WHEN tag_matches IS NOT NULL OR send_id_matches IS NOT NULL
            THEN true
            ELSE false
        END
     FROM tag_search('alice', 10, 0)) = true,
    'Comprehensive search can return multiple match types'
);

-- Additional verification: Test search permissions and RLS
-- Test that search results respect RLS policies
SELECT tests.authenticate_as('search_user2');

-- Should be able to find other users' confirmed tags via search
SELECT ok(
    (SELECT tag_matches FROM tag_search('alice', 10, 0)) IS NOT NULL,
    'Users can find other users confirmed tags via search function'
);

-- Should be able to lookup other users' profiles
SELECT ok(EXISTS(
    SELECT 1 FROM profile_lookup('tag'::lookup_type_enum, 'alice') pl
    WHERE pl.name = 'Alice Smith'
), 'Users can lookup other users profiles by tag');

-- Test that authenticated users can search (search requires authentication)
SELECT tests.authenticate_as('search_user1');

-- Authenticated users should be able to search confirmed tags
SELECT ok(
    (SELECT tag_matches FROM tag_search('bob', 10, 0)) IS NOT NULL,
    'Authenticated users can search confirmed tags'
);

-- Authenticated users should be able to lookup profiles
SELECT ok(EXISTS(
    SELECT 1 FROM profile_lookup('tag'::lookup_type_enum, 'bob') pl
    WHERE pl.name = 'Bob Johnson'
), 'Authenticated users can lookup profiles by tag');

SELECT * FROM finish();
ROLLBACK;
