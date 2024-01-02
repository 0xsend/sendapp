BEGIN;

-- Plan the number of tests to run
SELECT plan(10);

CREATE EXTENSION "basejump-supabase_test_helpers";

CREATE OR REPLACE FUNCTION tests.webauthn_credential() RETURNS uuid AS $$
DECLARE cred_id uuid;

creds_count integer;

BEGIN -- Generate a new UUID for the credential
cred_id := extensions.uuid_generate_v4();

-- Get the count of existing credentials for the user to ensure uniqueness
creds_count := (
  SELECT COUNT(*)
  FROM public.webauthn_credentials
  WHERE user_id = auth.uid()
);

-- Create a webauthn_credential for the user with unique values
INSERT INTO public.webauthn_credentials(
    id,
    name,
    display_name,
    raw_credential_id,
    public_key,
    key_type,
    sign_count,
    attestation_object
  )
VALUES (
    cred_id,
    -- Use the generated UUID
    'test_credential_' || creds_count::text,
    -- Append count for uniqueness
    'Test Credential ' || creds_count::text,
    -- Append count for uniqueness
    decode(
      '00112233445566778899AABBCCDDEEFF' || LPAD(creds_count::text, 2, '0'),
      'hex'
    ),
    -- Append count for uniqueness
    decode(
      '00112233445566778899AABBCCDDEEFF' || LPAD(creds_count::text, 2, '0'),
      'hex'
    ),
    -- Append count for uniqueness
    'ES256',
    0,
    decode(
      '00112233445566778899AABBCCDDEEFF' || LPAD(creds_count::text, 2, '0'),
      'hex'
    ) -- Append count for uniqueness
  )
RETURNING id INTO cred_id;

RETURN cred_id;

END;

$$ LANGUAGE plpgsql;

-- Create a test user and authenticate
SELECT tests.create_supabase_user('send_account_test_user');

SELECT tests.authenticate_as('send_account_test_user');

-- Test inserting a valid send account
SELECT lives_ok(
    $$
    INSERT INTO public.send_accounts(
        user_id,
        address,
        chain_id,
        init_code
      )
    VALUES (
        tests.get_supabase_uid('send_account_test_user'),
        '0x1234567890ABCDEF1234567890ABCDEF12345678',
        1,
        '\\x00112233445566778899AABBCCDDEEFF'
      ) $$,
      'Insert a valid send account'
  );

-- Test check constraint for address format
SELECT throws_ok(
    $$
    INSERT INTO public.send_accounts(
        user_id,
        address,
        chain_id,
        init_code
      )
    VALUES (
        tests.get_supabase_uid('send_account_test_user'),
        'invalid_address',
        1,
        '\\x00112233445566778899AABBCCDDEEFF'
      ) $$,
      'new row for relation "send_accounts" violates check constraint "chain_addresses_address_check"',
      'Insert should fail due to invalid address format'
  );

-- Test uniqueness of address and chain_id
SELECT throws_ok(
    $$
    INSERT INTO public.send_accounts(
        user_id,
        address,
        chain_id,
        init_code
      )
    VALUES (
        tests.get_supabase_uid('send_account_test_user'),
        '0x1234567890ABCDEF1234567890ABCDEF12345678',
        1,
        '\\x00112233445566778899AABBCCDDEEFF'
      ) $$,
      'duplicate key value violates unique constraint "send_accounts_address_key"',
      'Insert should fail due to duplicate address and chain_id'
  );

-- Test inserting a valid send account credential
SELECT lives_ok(
    $$
    INSERT INTO public.send_account_credentials(
        account_id,
        credential_id,
        key_slot
      )
    VALUES (
        (
          SELECT id
          FROM public.send_accounts
          WHERE user_id = tests.get_supabase_uid('send_account_test_user')
          LIMIT 1
        ), tests.webauthn_credential(), 1
      ) $$, 'Insert a valid send account credential'
  );

-- Test key slot check constraint for valid range
SELECT throws_ok(
    $$
    INSERT INTO public.send_account_credentials(
        account_id,
        credential_id,
        key_slot
      )
    VALUES (
        (
          SELECT id
          FROM public.send_accounts
          WHERE user_id = tests.get_supabase_uid('send_account_test_user')
          LIMIT 1
        ), tests.webauthn_credential(), -1
      ) $$, 'new row for relation "send_account_credentials" violates check constraint "account_credentials_key_slot_check"', 'Insert should fail due to invalid key slot'
  );

-- Test unique constraint for account_id and key_slot
SELECT throws_ok(
    $$
    INSERT INTO public.send_account_credentials(
        account_id,
        credential_id,
        key_slot
      )
    VALUES (
        (
          SELECT id
          FROM public.send_accounts
          WHERE user_id = tests.get_supabase_uid('send_account_test_user')
          LIMIT 1
        ), tests.webauthn_credential(), 1
      ) $$, 'duplicate key value violates unique constraint "send_account_credentials_account_id_key_slot_key"', 'Insert should fail due to duplicate account_id and key_slot'
  );

-- Test RLS: Inserting as another user should fail
SELECT tests.create_supabase_user('another_send_account_test_user');

SELECT tests.authenticate_as('another_send_account_test_user');

SELECT throws_ok(
    $$
    INSERT INTO public.send_accounts(
        user_id,
        address,
        chain_id
      )
    VALUES (
        tests.get_supabase_uid('send_account_test_user'),
        '0x9876543210FEDCBA9876543210FEDCBA98765432',
        2
      ) $$,
      'new row violates row-level security policy for table "send_accounts"',
      'Insert should fail due to RLS policy violation'
  );

-- Test update operations
SELECT tests.authenticate_as('send_account_test_user');

SELECT lives_ok(
    $$
    UPDATE public.send_accounts
    SET address = '0x9876543210FEDCBA9876543210FEDCBA98765432'
    WHERE user_id = tests.get_supabase_uid('send_account_test_user') $$,
      'Update send account address'
  );

-- Test deletion of account credentials
SELECT lives_ok(
    $$
    DELETE FROM public.send_account_credentials
    WHERE account_id = (
        SELECT id
        FROM public.send_accounts
        WHERE user_id = tests.get_supabase_uid('send_account_test_user')
        LIMIT 1
      )
      AND key_slot = 1 $$,
      'Delete send account credential'
  );

-- Test insertion of account credentials with non-existent account
SELECT throws_ok(
    $$
    INSERT INTO public.send_account_credentials(
        account_id,
        credential_id,
        key_slot
      )
    VALUES (
        gen_random_uuid(),
        -- Non-existent account ID
        tests.webauthn_credential(),
        1
      ) $$,
      'new row violates row-level security policy for table "send_account_credentials"',
      'Insert should fail due to non-existent account'
  );

-- Complete the tests
SELECT *
FROM finish();

ROLLBACK;
