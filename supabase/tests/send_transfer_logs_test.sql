-- Unit Test for insert_send_transfer_logs Function
BEGIN;

SELECT plan(2);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Insert a row into send_transfer_logs
INSERT INTO public.send_transfer_logs (
    "from",
    "to",
    value,
    block_number,
    block_timestamp,
    block_hash,
    tx_hash,
    log_index
  )
VALUES (
    '0x1234567890123456789012345678901234567891',
    '0x1234567890123456789012345678901234567891',
    200,
    2,
    '2022-09-20 00:00:01+00',
    '0x1234567890123456789012345678901234567890123456789012345678901235',
    '0x1234567890123456789012345678901234567890123456789012345678901235',
    1
  ),
  (
    '0x1234567890123456789012345678901234567891',
    '0x1234567890123456789012345678901234567891',
    200,
    2,
    '2022-09-20 00:00:01+00',
    '0x1234567890123456789012345678901234567890123456789012345678901235',
    '0x1234567890123456789012345678901234567890123456789012345678901235',
    2
  );

-- Now update this row using the function
SELECT public.insert_send_transfer_logs(
    ARRAY [
        ROW('0x1234567890123456789012345678901234567891', '0x1234567890123456789012345678901234567891', 300, 2, '2022-09-20 00:00:02+00', '0x1234567890123456789012345678901234567890123456789012345678901235', '0x1234567890123456789012345678901234567890123456789012345678901235', 1, now())::public.send_transfer_logs
    ]
  );

-- Validate the row got updated
SELECT results_eq(
    $$
    SELECT value
    FROM public.send_transfer_logs
    WHERE block_hash = '0x1234567890123456789012345678901234567890123456789012345678901235' $$,
      $$VALUES (300::bigint) $$,
      'Row was successfully updated by insert_send_transfer_logs function'
  );

-- User cannot insert rows
select tests.create_supabase_user('hodler');
select tests.authenticate_as('hodler');

select throws_ok($$SELECT public.insert_send_transfer_logs(
    ARRAY [
        ROW('0x1234567890123456789012345678901234567891', '0x1234567890123456789012345678901234567891', 300, 2, '2022-09-20 00:00:02+00', '0x1234567890123456789012345678901234567890123456789012345678901235', '0x1234567890123456789012345678901234567890123456789012345678901235', 1, now())::public.send_transfer_logs
    ]
  ) $$, 'new row violates row-level security policy for table "send_transfer_logs"', 'Should raise exception if user does not have permission to insert rows');

SELECT *
FROM finish();

ROLLBACK;
