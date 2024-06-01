-- 3. Tag Confirmation
BEGIN;

SELECT plan(3);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('hacker', null, '10987654321');

SELECT tests.authenticate_as('hacker');

-- User cannot fake OTP credentials for themselves
SELECT throws_ok(
    $$SELECT fake_otp_credentials('10987654321');

$$,
    'permission denied for function fake_otp_credentials',
    'User should not be able to fake OTP credentials for themselves'
);

SELECT tests.clear_authentication();

SET ROLE postgres;

SELECT results_eq(
    $$
    SELECT confirmation_token::text,
      to_char(confirmation_sent_at, 'YYYY-MM-DD HH24:MI:SS.US') as confirmation_sent_at
    FROM auth.users
    WHERE phone = '10987654321' $$,
    $$VALUES (NULL, NULL) $$,
    'User should not be able to fake OTP credentials for themselves'
);

SET ROLE service_role;

SELECT fake_otp_credentials('10987654321');

SELECT results_eq(
    $$
    SELECT confirmation_token::text,
      to_char(confirmation_sent_at, 'YYYY-MM-DD HH24:MI:SS.US') as confirmation_sent_at
    FROM auth.users
    WHERE phone = '10987654321' $$,
    $$VALUES (
        'd6c03a90e5602b4bdf9b8ee7590367a68bf2600640d961fe028c2eea',
        to_char(now(), 'YYYY-MM-DD HH24:MI:SS.US')
      ) $$,
    'Service role should be able to fake OTP credentials for a user'
);

SELECT finish();

ROLLBACK;
