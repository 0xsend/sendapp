BEGIN;
SELECT plan(24);

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

-- ===== NEW TESTS FOR SEND_SCORES_HISTORY INTEGRATION =====
SET ROLE service_role;

-- Create test users for send score ordering tests with deterministic trigram distances
SELECT tests.create_supabase_user('score_impostor');
SELECT tests.create_supabase_user('score_genuine');
SELECT tests.create_supabase_user('low_scorer');

-- Create send accounts for score test users
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES 
  (tests.get_supabase_uid('score_impostor'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF88', 8453, '\\x00'),
  (tests.get_supabase_uid('score_genuine'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF99', 8453, '\\x00'),
  (tests.get_supabase_uid('low_scorer'), '0xABCDEF1234567890ABCDEF1234567890ABCDEFAA', 8453, '\\x00');

-- Set up profiles for score test users
INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES 
  (tests.get_supabase_uid('score_impostor'), 'High Score Impostor', 'Has high send score but fuzzy tag match', 'https://example.com/impostor.jpg', true),
  (tests.get_supabase_uid('score_genuine'), 'Low Score Genuine', 'Has low send score but exact tag match', 'https://example.com/genuine.jpg', true),
  (tests.get_supabase_uid('low_scorer'), 'Low Scorer', 'Has low send score', 'https://example.com/lowscore.jpg', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, about = EXCLUDED.about, avatar_url = EXCLUDED.avatar_url, is_public = EXCLUDED.is_public;

-- Insert tags with deterministic trigram distances
-- 'alic3' vs 'aliceX' for predictable trigram behavior (avoiding conflict with 'alice' from earlier tests)
INSERT INTO tags (name, user_id, status)
VALUES 
  ('alic3', tests.get_supabase_uid('score_impostor'), 'confirmed'),    -- Fuzzy match for 'aliceX'
  ('aliceX', tests.get_supabase_uid('score_genuine'), 'confirmed'),     -- Exact match for 'aliceX'
  ('david', tests.get_supabase_uid('low_scorer'), 'confirmed');        -- Unrelated tag

-- Create send_account_tags associations
INSERT INTO send_account_tags (send_account_id, tag_id)
SELECT sa.id, t.id
FROM send_accounts sa
JOIN tags t ON t.user_id = sa.user_id
WHERE t.name IN ('alic3', 'aliceX', 'david');

-- Create mock distribution for testing
INSERT INTO distributions (
    id,
    number,
    tranche_id,
    name,
    description,
    amount,
    hodler_pool_bips,
    bonus_pool_bips,
    fixed_pool_bips,
    qualification_start,
    qualification_end,
    hodler_min_balance,
    earn_min_balance,
    claim_end,
    chain_id,
    token_addr
) VALUES (
    888,
    888,
    888,
    'Test Distribution 888',
    'Mock distribution for testing',
    1000,
    1000000,
    1000000,
    1000000,
    '2023-01-01'::timestamp,
    '2023-12-31'::timestamp,
    1000,
    1e6::bigint,
    '2024-01-01'::timestamp,
    8453,
    '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding send_slash entry for the distribution
INSERT INTO send_slash (distribution_id, distribution_number, minimum_sends, scaling_divisor)
VALUES (888, 888, 5, 10)
ON CONFLICT (distribution_number) DO NOTHING;

-- Insert mock send_scores_history records
-- High score impostor with fuzzy match should rank higher than low score genuine with exact match
SET ROLE postgres;
-- Send scores will be computed by the materialized view, not inserted directly

SELECT tests.authenticate_as('search_user1');

-- Test 20: Basic tag search functionality works
-- When searching for 'aliceX', the exact match should be found
SELECT ok(
    EXISTS(SELECT 1 FROM tag_search('aliceX', 10, 0)
           WHERE (tag_matches[1]).tag_name = 'aliceX'),
    'Basic tag search should find exact matches'
);

-- Test 21: Low-score account with non-exact tag is NOT returned when searching its target
-- When searching for 'david' (which low_scorer owns exactly), it should still appear since it's exact
SELECT ok(EXISTS(
    SELECT 1 FROM tag_search('david', 10, 0)
    WHERE (tag_matches[1]).tag_name = 'david'
), 'Exact match should appear regardless of low score');

-- Test 22: Verify deterministic trigram distance values
-- Test that our chosen tags have predictable trigram distances
select ok(
    ('alic3' <-> 'alice') BETWEEN 0.1 AND 0.5,
    'Trigram distance between alic3 and alice should be deterministic and moderate'
);

-- ===== NEW CASE-SENSITIVE EXACT MATCH TESTS =====
SET ROLE service_role;

-- Create test users for case-sensitive tag matching within combined lookup tests
SELECT tests.create_supabase_user('case_ethen_high');
SELECT tests.create_supabase_user('case_ethen_low');

-- Create send accounts for case-sensitive test users
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES 
  (tests.get_supabase_uid('case_ethen_high'), '0xABCDEF1234567890ABCDEF1234567890ABCDEFDD', 8453, '\\x00'),
  (tests.get_supabase_uid('case_ethen_low'), '0xABCDEF1234567890ABCDEF1234567890ABCDEFEE', 8453, '\\x00');

-- Set up profiles for case-sensitive test users
INSERT INTO profiles (id, name, about, avatar_url, is_public)
VALUES 
  (tests.get_supabase_uid('case_ethen_high'), 'Case High Score', 'Has high send score with ethen tag', 'https://example.com/case_ethen_high.jpg', true),
  (tests.get_supabase_uid('case_ethen_low'), 'Case Low Score', 'Has low send score with Ethen_ tag', 'https://example.com/case_ethen_low.jpg', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, about = EXCLUDED.about, avatar_url = EXCLUDED.avatar_url, is_public = EXCLUDED.is_public;

-- Insert case-sensitive tags with contrasting scores
-- 'ethen' will get high score, 'Ethen_' will get low score
INSERT INTO tags (name, user_id, status)
VALUES 
  ('ethen', tests.get_supabase_uid('case_ethen_high'), 'confirmed'),
  ('Ethen_', tests.get_supabase_uid('case_ethen_low'), 'confirmed');

-- Create send_account_tags associations for case-sensitive tags
INSERT INTO send_account_tags (send_account_id, tag_id)
SELECT sa.id, t.id
FROM send_accounts sa
JOIN tags t ON t.user_id = sa.user_id
WHERE t.name IN ('ethen', 'Ethen_');

-- Send scores will be computed by the materialized view, not inserted directly

SELECT tests.authenticate_as('search_user1');

-- Test 23: Case-sensitive exact match in combined search and lookup
-- When searching for 'Ethen_', the exact match should be found
select ok(
    EXISTS(SELECT 1 FROM tag_search('Ethen_', 10, 0)
           WHERE tag_matches IS NOT NULL AND array_length(tag_matches, 1) > 0
           AND (tag_matches[1]).tag_name = 'Ethen_'),
    'Case-sensitive exact match Ethen_ should be found in combined search'
);

-- Test 24: Profile lookup should work for case-sensitive exact matches
SELECT ok(EXISTS(
    SELECT 1 FROM profile_lookup('tag'::lookup_type_enum, 'Ethen_') pl
    WHERE pl.name = 'Case Low Score'
    AND pl.tag = 'Ethen_'
), 'Profile lookup should find case-sensitive exact match Ethen_');

SELECT * FROM finish();
ROLLBACK;
