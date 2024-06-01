BEGIN;

SELECT plan(10);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create a test user
SELECT tests.create_supabase_user('address_owner');

SELECT tests.create_supabase_user('address_reader');

SELECT tests.authenticate_as('address_owner');

-- Test inserting a chain address
SELECT throws_ok(
    $$
    INSERT INTO chain_addresses(address, user_id)
    VALUES(
        '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
        tests.get_supabase_uid('address_owner')
      ) $$,
    'new row violates row-level security policy for table "chain_addresses"',
    'User should not be able to insert a chain address'
);

-- Test adding a chain address
SET role TO postgres;

INSERT INTO chain_addresses (address, user_id)
VALUES (
    '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
    tests.get_supabase_uid('address_owner')
);

-- Test cannot add more than one address per user
SELECT throws_ok(
    $$
    INSERT INTO chain_addresses(address, user_id)
    VALUES (
        '0x5355c409fa3D0901292231Ddb953C949C2211D96',
        tests.get_supabase_uid('address_owner')
      ) $$,
    'User can have at most 1 address',
    'User should not be able to add more than one address'
);

-- Test viewing a chain address
SELECT tests.authenticate_as('address_owner');

SELECT results_eq(
    $$SELECT address
    FROM chain_addresses
    WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f' $$,
    $$VALUES (
        '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f'::citext
      ) $$,
    'User should be able to add a chain address'
);

-- Test case insensitivity
SELECT results_eq(
    $$SELECT address
    FROM chain_addresses
    WHERE address = '0xfb00d9cda6dad99994849d7c66fa2631f280f64f' $$,
    $$VALUES (
        '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f'::citext
      ) $$,
    'Address should be case-insensitive'
);

-- Test updating a chain address
UPDATE chain_addresses
SET address = '0x0000000000000000000000000000000000000000'
WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f';

SELECT results_eq(
    $$SELECT address
    FROM chain_addresses
    WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f' $$,
    $$VALUES (
        '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f'::citext
      ) $$,
    'User should not be able to update a chain address'
);

-- Test deleting a chain address
DELETE FROM chain_addresses
WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f';

SELECT isnt_empty(
    $$SELECT address
    FROM chain_addresses
    WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f' $$,
    'User should not be able to delete a chain address'
);

SET role TO service_role;

DELETE FROM chain_addresses
WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f';

SELECT is_empty(
    $$SELECT address
    FROM chain_addresses
    WHERE address = '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f' $$,
    'Admin should be able to delete a chain address'
);

SET role TO postgres;

-- Test adding an invalid address
SELECT throws_ok(
    $$INSERT INTO chain_addresses(address, user_id)
    VALUES (
        'InvalidAddress',
        tests.get_supabase_uid('address_owner')
      ) $$,
    'new row for relation "chain_addresses" violates check constraint "chain_addresses_address_check"',
    'Should not be able to insert an invalid address'
);

-- Test adding a duplicate address
SELECT throws_ok(
    $$INSERT INTO chain_addresses(address, user_id)
    VALUES (
        '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
        tests.get_supabase_uid('address_owner')
      ),
      (
        '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
        tests.get_supabase_uid('address_owner')
      ) $$,
    'duplicate key value violates unique constraint "chain_addresses_pkey"',
    'Should not be able to insert a duplicate address'
);

-- Test cannot read other user addresses
SELECT tests.authenticate_as('address_reader');

SELECT is_empty(
    $$SELECT address
    FROM chain_addresses $$,
    'User should not be able to read other user addresses'
);

SELECT FINISH();

ROLLBACK;
