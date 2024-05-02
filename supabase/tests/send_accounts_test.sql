BEGIN;

-- Plan the number of tests to run
SELECT plan(15);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- This function creates a new webauthn_credential row
CREATE OR REPLACE FUNCTION tests.new_webauthn_credential() RETURNS SETOF webauthn_credentials AS $$
DECLARE creds_count INTEGER;

BEGIN -- Generate a new UUID for the credential
-- Get the count of existing credentials for the user to ensure uniqueness
creds_count := (
  SELECT COUNT(*)
  FROM public.webauthn_credentials
  WHERE user_id = auth.uid()
);

-- Return the new credential as a set of webauthn_credentials
RETURN QUERY
SELECT gen_random_uuid() AS id,
  'test_credential_' || creds_count::text AS name,
  'Test Credential ' || creds_count::text AS display_name,
  decode(
    '00112233445566778899AABBCCDDEEF' || LPAD(creds_count::text, 3, '0'),
    'hex'
  ) AS raw_credential_id,
  auth.uid() AS user_id,
  decode(
    '00112233445566778899AABBCCDDEEF' || LPAD(creds_count::text, 3, '0'),
    'hex'
  ) AS public_key,
  'ES256'::key_type_enum AS key_type,
  0::bigint AS sign_count,
  decode(
    '00112233445566778899AABBCCDDEEF' || LPAD(creds_count::text, 3, '0'),
    'hex'
  ) AS attestation_object,
  now() AS created_at,
  now() AS updated_at,
  NULL::timestamptz AS deleted_at;

END;

$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tests.insert_webauthn_credential() RETURNS uuid AS $$
declare cred_id uuid;

BEGIN -- Generate a new UUID for the credential
-- Create a webauthn_credential for the user with unique values
INSERT INTO public.webauthn_credentials(
    name,
    display_name,
    raw_credential_id,
    public_key,
    sign_count,
    attestation_object,
    key_type
  )
SELECT name,
  display_name,
  raw_credential_id,
  public_key,
  sign_count,
  attestation_object,
  key_type
FROM tests.new_webauthn_credential()
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
        ), tests.insert_webauthn_credential(), 1
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
        ), tests.insert_webauthn_credential(), -1
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
        ), tests.insert_webauthn_credential(), 1
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
        tests.insert_webauthn_credential(),
        1
      ) $$,
      'new row violates row-level security policy for table "send_account_credentials"',
      'Insert should fail due to non-existent account'
  );

-- Test function create_send_account(send_account, webauthn_credential, key_slot)
SELECT isnt_empty(
    $$
    SELECT public.create_send_account(
        (
          SELECT row(sa.*)::send_accounts sa
          FROM public.send_accounts sa
          WHERE user_id = tests.get_supabase_uid('send_account_test_user')
          LIMIT 1
        ), tests.new_webauthn_credential(), 1
      ) $$, 'Create send account with credential'
  );

-- Test users can only create 1 send account
SELECT throws_ok(
    $$
    SELECT public.create_send_account(
        (
          row(
            gen_random_uuid(),
            tests.get_supabase_uid('send_account_test_user'),
            '0x1234567890ABCDEF1234567890ABCDEF12345678',
            1,
            '\\x00112233445566778899AABBCCDDEEFF',
            now(),
            now(),
            NULL
          )::send_accounts
        ),
        tests.new_webauthn_credential(),
        0
      ) $$,
      'User can have at most 1 send account',
      'User can have at most 1 send account'
  );

-- Test send_accounts_add_webauthn_credential function
SELECT isnt_empty(
    $$
    SELECT public.send_accounts_add_webauthn_credential(
        (
          SELECT id
          FROM public.send_accounts
          WHERE user_id = tests.get_supabase_uid('send_account_test_user')
          LIMIT 1
        ), tests.new_webauthn_credential(), 0
      ) $$, 'Add webauthn credential to send account, first key slot'
  );

SELECT results_eq(
    $$
    SELECT count(*)::integer
    FROM public.send_account_credentials
    WHERE account_id = (
        SELECT id
        FROM public.send_accounts
        WHERE user_id = tests.get_supabase_uid('send_account_test_user')
        LIMIT 1
      ) and key_slot = 0
      $$,
      $$VALUES (1) $$,
      'Add webauthn credential to send account, check key slot 0'
  );

--  test users can replace an existing credential with the same key slot
do $$
declare
  new_cred webauthn_credentials;
begin
  select * from tests.new_webauthn_credential() into new_cred;
  select * from public.send_accounts_add_webauthn_credential(
      (
        select id
        from public.send_accounts
        where user_id = tests.get_supabase_uid('send_account_test_user')
        limit 1
      ), new_cred, 0
    ) into new_cred;

    EXECUTE format('SET SESSION "vars.new_cred_id" TO %L', new_cred.id);

end;
$$ language plpgsql;

select results_eq(
    $$
    SELECT credential_id
    FROM public.send_account_credentials
    WHERE account_id = (
        SELECT id
        FROM public.send_accounts
        WHERE user_id = tests.get_supabase_uid('send_account_test_user')
        LIMIT 1
      ) and key_slot = 0
      $$,
      $$select current_setting('vars.new_cred_id')::uuid$$,
      'Replace webauthn credential on send account, key slot 0'
  );

-- Complete the tests
SELECT *
FROM finish();

ROLLBACK;
