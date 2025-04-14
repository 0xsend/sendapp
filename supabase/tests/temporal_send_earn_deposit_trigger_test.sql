-- Test suite for the temporal_deposit_insert_pending_activity trigger
BEGIN;

SELECT plan(6); -- Number of tests

-- 1. Setup: Create a user and send account for testing
-- Insert into auth.users first (Supabase trigger should create the profile)
INSERT INTO auth.users (id, email, role, created_at, updated_at)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'test@example.com', 'authenticated', now(), now());
-- Now insert the send account referencing the user ID, including chain_id and init_code
INSERT INTO public.send_accounts (user_id, address, chain_id, init_code) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '0x1234567890123456789012345678901234567890', 8453, decode('', 'hex'));

-- 2. Test Case 1: Insert temporal deposit with NULL vault
-- Expect: Activity record created without 'vault' in data
INSERT INTO temporal.send_earn_deposits (workflow_id, owner, assets)
VALUES ('test-workflow-null-vault', decode('1234567890123456789012345678901234567890', 'hex'), 1000000); -- owner matches send_accounts address

-- 3. Verification 1.1: Check if activity record exists
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE event_id = 'test-workflow-null-vault' $$,
    $$ VALUES ('temporal_send_earn_deposit'::text) $$,
    'Test 1.1: Activity record should be created for null vault deposit'
);

-- 4. Verification 1.2: Check if 'vault' key is absent in data JSONB
SELECT results_eq(
    $$ SELECT data ? 'vault' FROM public.activity WHERE event_id = 'test-workflow-null-vault' $$,
    $$ VALUES (false) $$,
    'Test 1.2: Activity data should NOT contain "vault" key for null vault deposit'
);

-- 5. Verification 1.3: Check if owner is present in data JSONB
SELECT results_eq(
    $$ SELECT data ->> 'owner' FROM public.activity WHERE event_id = 'test-workflow-null-vault' $$,
    $$ VALUES (decode('1234567890123456789012345678901234567890', 'hex')::text) $$,
    'Test 1.3: Activity data should contain correct "owner"'
);

-- 6. Test Case 2: Insert temporal deposit with NON-NULL vault
-- Expect: Activity record created WITH 'vault' in data
INSERT INTO temporal.send_earn_deposits (workflow_id, owner, assets, vault)
VALUES ('test-workflow-with-vault', decode('1234567890123456789012345678901234567890', 'hex'), 2000000, decode('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'hex'));

-- 7. Verification 2.1: Check if activity record exists
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE event_id = 'test-workflow-with-vault' $$,
    $$ VALUES ('temporal_send_earn_deposit'::text) $$,
    'Test 2.1: Activity record should be created for non-null vault deposit'
);

-- 8. Verification 2.2: Check if 'vault' key is PRESENT in data JSONB
SELECT results_eq(
    $$ SELECT data ? 'vault' FROM public.activity WHERE event_id = 'test-workflow-with-vault' $$,
    $$ VALUES (true) $$,
    'Test 2.2: Activity data SHOULD contain "vault" key for non-null vault deposit'
);

-- 9. Verification 2.3: Check if vault value is correct
SELECT results_eq(
    $$ SELECT data ->> 'vault' FROM public.activity WHERE event_id = 'test-workflow-with-vault' $$,
    $$ VALUES (decode('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'hex')::text) $$,
    'Test 2.3: Activity data should contain correct "vault" value'
);


-- Finish tests
SELECT * FROM finish();

ROLLBACK;
