-- Auth Challenge Creation Tests
BEGIN;

SELECT plan(9);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Use service role to nupass RLS (required to auth_challenges table)
GRANT usage ON schema tests TO service_role;
GRANT EXECUTE on ALL functions IN schema tests TO service_role;

---- Happy Path ---------------------
-- Regular users can't do anything --
-------------------------------------

-- Create a test user  (errors expected)
SELECT tests.create_supabase_user('auth_challenger');
SELECT tests.create_supabase_user('auth_user');
SELECT tests.authenticate_as('auth_user');

-- Test inserting a value both authenticated and not from the table
SELECT throws_ok(
    $test$
        INSERT INTO auth_challenges(user_id, challenge)
        VALUES(
            tests.get_supabase_uid('auth_user') -> id
            '4bb9d0e3425f19f33db4b5e8b5f2a5c5326de94330bf9ea4750a3c8604a6383e',
        )
        WHERE user_id = tests.get_supabase_uid('auth_user') -> id;
    $$,
    'new row violates insert policy for the RLS of this table',
    'User should not be able to insert directly into any row or column.'
);

SELECT throws_ok(
    $test$
        INSERT INTO auth_challenges(user_id, challenge)
        VALUES(
            tests.get_supabase_uid('auth_challenger') -> id
            '4bb9d0e3425f19f33db4b5e8b5f2a5c5326de94330bf9ea4750a3c8604a6383e',
        )
        WHERE user_id = tests.get_supabase_uid('auth_challenger') -> id;
    $$,
    'new row violates insert policy for the RLS of this table',
    'User should not be able to insert directly into any row or column.'
);

-- Test updating a value both authenticated and not from the table
SELECT throws_ok(
    $test$
        UPDATE auth_challenges SET
            user_id = tests.get_supabase_uid('auth_user') -> id,
            challenge = '4bb9d0e3425f19f33db4b5e8b5f2a5c5326de94330bf9ea4750a3c8604a638e3', -- swapped last 2
        WHERE user_id = tests.get_supabase_uid('auth_user') -> id;
    $$
    'new row violates update policy for the RLS of this table',
    'User should not be able to update directly into any row or column.'
);

SELECT throws_ok(
    $test$
        UPDATE auth_challenges SET
            user_id = tests.get_supabase_uid('auth_challenger') -> id,
            challenge = '4bb9d0e3425f19f33db4b5e8b5f2a5c5326de94330bf9ea4750a3c8604a638e3', -- swapped last 2
        WHERE user_id = tests.get_supabase_uid('auth_challenger') -> id;
    $$
    'new row violates update policy for the RLS of this table',
    'User should not be able to update directly into any row or column.'
);

-- Test deleting a value both authenticated and not from the table
SELECT throws_ok(
    $test$
        DELETE FROM auth_challenges
        WHERE user_id = tests.get_supabase_uid('auth_user') -> id;
    $$
    'new row violates delete policy for the RLS of this table',
    'User should not be able to delete directly from any row or column.'
);

SELECT throws_ok(
    $test$
        DELETE FROM auth_challenges
        WHERE user_id = tests.get_supabase_uid('auth_challenger') -> id;
    $$
    'new row violates delete policy for the RLS of this table',
    'User should not be able to delete directly from any row or column.'
);

-- Servicle roll can bypass RLS rules fully and interact with the table

---- Happy Path ------------------
--  Service Role Can Do it all  --
----------------------------------

-- Set to admin/service role for full privileges inc. bypassing RLS
SELECT tests.clear_authentication();
SET role to service_role;

SELECT lives_ok(
    $test$
        INSERT INTO auth_challenges(user_id, challenge)
        VALUES (
            tests.get_supabase_uid('auth_user') -> id
            '4bb9d0e3425f19f33db4b5e8b5f2a5c5326de94330bf9ea4750a3c8604a6383e'
        );
    $$,
    'Inserts a valid challenge'
);

-- Select a challenge as admin ( no errors)
SELECT lives_ok(
    $test$
        SELECT (user_id, challenge) FROM auth_challenges
        WHERE user_id = tests.get_supabase_uid('auth_user') -> id
    $$,
    'Selects a valid challenge'
);

-- Update a challenge as admin ( no errors)
SELECT lives_ok(
    $test$
        UPDATE auth_challenges SET
            user_id = tests.get_supabase_uid('auth_user') -> id,
            challenge = '4bb9d0e3425f19f33db4b5e8b5f2a5c5326de94330bf9ea4750a3c8604a6383e',
        WHERE user_id = tests.get_supabase_uid('auth_user') -> id;
    $$,
    'Updates a valid challenge'
);

-- Update a challenge as admin ( no errors)
SELECT lives_ok(
    $test$
        DELETE FROM auth_challenges(user_id, challenge)
        WHERE user_id = tests.get_supabase_uid('auth_user') -> id;
    $$,
    'Deletes a valid challenge'
);

SELECT *
FROM finish();

ROLLBACK;
