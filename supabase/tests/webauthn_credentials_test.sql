BEGIN;

-- Plan the number of tests to run
SELECT plan(8);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create a test user
SELECT tests.create_supabase_user('webauthn_user');

SELECT tests.create_supabase_user('webauthn_user_another_user');

-- Authenticate as the test user
SELECT tests.authenticate_as('webauthn_user');

-- Test inserting a valid credential
SELECT lives_ok(
    $$
    INSERT INTO public.webauthn_credentials(
        name,
        display_name,
        raw_credential_id,
        public_key,
        key_type,
        sign_count,
        attestation_object
      )
    VALUES (
        'test_credential',
        'Test Credential',
        decode('00112233445566778899AABBCCDDEEFF', 'hex'),
        decode('00112233445566778899AABBCCDDEEFF', 'hex'),
        'ES256',
        0,
        decode('00112233445566778899AABBCCDDEEFF', 'hex')
      ) $$,
      'Insert a valid webauthn credential'
  );

-- Test updating a credential
SELECT lives_ok(
    $$
    UPDATE public.webauthn_credentials
    SET sign_count = 1
    WHERE user_id = tests.get_supabase_uid('webauthn_user')
      AND name = 'test_credential' $$,
      'Update a valid webauthn credential'
  );

SELECT throws_ok(
    $$
    UPDATE public.webauthn_credentials
    SET user_id = tests.get_supabase_uid('webauthn_user_another_user')
    WHERE user_id = tests.get_supabase_uid('webauthn_user')
      AND name = 'test_credential' $$,
      'new row violates row-level security policy for table "webauthn_credentials"',
      'Update should fail due to RLS policy violation'
  );

select is(
    tests.get_supabase_uid('webauthn_user'),
    (
      SELECT user_id
      FROM public.webauthn_credentials
      WHERE user_id = tests.get_supabase_uid('webauthn_user')
        AND name = 'test_credential'
    ),
    'Credential should have been deleted'
  );

-- Test check constraint for sign_count
SELECT throws_ok(
    $$
    INSERT INTO public.webauthn_credentials(
        name,
        display_name,
        raw_credential_id,
        public_key,
        key_type,
        sign_count,
        attestation_object
      )
    VALUES (
        'test_credential',
        'Test Credential',
        decode('FEDCBA98765432100123456789ABCDEF', 'hex'),
        decode('FEDCBA98765432100123456789ABCDEF', 'hex'),
        'ES256',
        -1,
        decode('FEDCBA98765432100123456789ABCDEF', 'hex')
      ) $$,
      'new row for relation "webauthn_credentials" violates check constraint "webauthn_credentials_sign_count_check"',
      'Insert should fail due to negative sign_count'
  );

-- Test uniqueness of raw_credential_id
SELECT throws_ok(
    $$
    INSERT INTO public.webauthn_credentials(
        name,
        display_name,
        raw_credential_id,
        public_key,
        key_type,
        sign_count,
        attestation_object
      )
    VALUES (
        'test_credential',
        'Test Credential',
        decode('00112233445566778899AABBCCDDEEFF', 'hex'),
        decode('FFEEAABB44556677889900CCDDEE1122', 'hex'),
        'ES256',
        0,
        decode('FFEEAABB44556677889900CCDDEE1122', 'hex')
      ) $$,
      'duplicate key value violates unique constraint "webauthn_credentials_raw_credential_id"',
      'Insert should fail due to duplicate raw_credential_id'
  );

-- Test row level security policies (insert, select, update, delete)
-- Test inserting as another user
SELECT tests.authenticate_as('webauthn_user_another_user');

SELECT throws_ok(
    $$
    INSERT INTO public.webauthn_credentials(
        name,
        display_name,
        raw_credential_id,
        user_id,
        public_key,
        key_type,
        sign_count,
        attestation_object
      )
    VALUES (
        'test_credential',
        'Test Credential',
        decode('11223344556677889900AABBCCDDEEFF', 'hex'),
        tests.get_supabase_uid('webauthn_user'),
        -- Trying to insert for webauthn_user
        decode('11223344556677889900AABBCCDDEEFF', 'hex'),
        'ES256',
        0,
        decode('11223344556677889900AABBCCDDEEFF', 'hex')
      ) $$,
      'new row violates row-level security policy for table "webauthn_credentials"',
      'Insert should fail due to RLS policy violation'
  );

-- Test deleting is not allowed
SELECT tests.authenticate_as('webauthn_user');

DELETE FROM public.webauthn_credentials
WHERE user_id = tests.get_supabase_uid('webauthn_user')
  AND name = 'test_credential';

SELECT is_empty(
    $$
    SELECT *
    FROM public.webauthn_credentials
    WHERE user_id = tests.get_supabase_uid('webauthn_user')
      AND name = 'test_credential' $$,
      'Credential should have been deleted'
  );

-- Complete the tests
SELECT *
FROM finish();

ROLLBACK;
