-- Test suite for the aab_temporal_deposit_update_activity_on_status_change trigger
BEGIN;

SELECT plan(10); -- Corrected plan count

-- Setup: Create user, send account, and initial temporal deposit + activity record
-- Ensure the user exists for FK constraints
INSERT INTO auth.users (id, email, role, created_at, updated_at)
VALUES ('b1ffb1ff-b1ff-b1ff-b1ff-b1ffb1ffb1ff', 'test_update@example.com', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING; -- Avoid error if user already exists from other tests

-- Ensure the send account exists (Use address format from send_accounts_test.sql)
INSERT INTO public.send_accounts (user_id, address, chain_id, init_code)
VALUES ('b1ffb1ff-b1ff-b1ff-b1ff-b1ffb1ffb1ff', '0x1234567890ABCDEF1234567890ABCDEF12345678', 8453, decode('', 'hex'))
ON CONFLICT (address, chain_id) DO NOTHING; -- Avoid error if account already exists

-- Insert the temporal deposit record, which should trigger the INSERT activity trigger
-- Use the same address for owner, but decoded as the column type is likely bytea
INSERT INTO temporal.send_earn_deposits (workflow_id, owner, assets, vault, status)
VALUES ('test-update-workflow-1', decode('1234567890ABCDEF1234567890ABCDEF12345678', 'hex'), 500000, decode('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'hex'), 'initialized');

-- Verify initial state (created by the INSERT trigger)
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('temporal_send_earn_deposit'::text) $$,
    'Setup: Initial activity event_name is "temporal_send_earn_deposit"'
);

-- Test Case 1: Update status to 'failed'
SELECT lives_ok(
    $$ UPDATE temporal.send_earn_deposits
       SET status = 'failed', error_message = 'Bundler connection failed', updated_at = now() + interval '1 second'
       WHERE workflow_id = 'test-update-workflow-1' $$,
    'Test 1.1: Update status to failed executes without error'
);
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('temporal_send_earn_deposit_failed'::text) $$,
    'Test 1.2: Activity event_name updated to "failed"'
);
SELECT results_eq(
    $$ SELECT data ->> 'status' FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('failed'::text) $$,
    'Test 1.3: Activity data contains "status": "failed"'
);
SELECT results_eq(
    $$ SELECT data ->> 'error_message' FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('Bundler connection failed'::text) $$,
    'Test 1.4: Activity data contains correct "error_message"'
);
-- Check if original data (like vault) is preserved and merged correctly
SELECT results_eq(
    $$ SELECT data ->> 'vault' FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::text) $$, -- Compare against text representation of bytea
    'Test 1.5: Activity data preserves original "vault" data'
);


-- Test Case 2: Update status from 'failed' to 'confirmed' (should NOT be changed by *this* trigger)
-- Ensure status is 'failed' before this test
UPDATE temporal.send_earn_deposits SET status = 'failed', error_message = 'Previous error' WHERE workflow_id = 'test-update-workflow-1';
SELECT lives_ok(
    $$ UPDATE temporal.send_earn_deposits
       SET status = 'confirmed', error_message = null, updated_at = now() + interval '2 seconds'
       WHERE workflow_id = 'test-update-workflow-1' $$,
    'Test 2.1: Update status from failed to confirmed executes without error'
);
-- The trigger should only act when NEW.status = 'failed', so event_name should remain 'failed'
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('temporal_send_earn_deposit_failed'::text) $$,
    'Test 2.2: Activity event_name remains "failed" when status changes to non-failed'
);

-- Test Case 3: Update other fields without changing status (should not trigger activity update)
-- Reset status to 'initialized' first
UPDATE temporal.send_earn_deposits SET status = 'initialized', error_message = null WHERE workflow_id = 'test-update-workflow-1';
-- Need to reset the activity record as well to reflect the 'initialized' state
UPDATE public.activity SET event_name = 'temporal_send_earn_deposit', data = data - 'status' - 'error_message' WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1');

SELECT lives_ok(
    $$ UPDATE temporal.send_earn_deposits
       SET assets = 600000, updated_at = now() + interval '3 seconds' -- Only update non-status field
       WHERE workflow_id = 'test-update-workflow-1' $$,
    'Test 3.1: Update non-status field executes without error'
);
-- The trigger condition `NEW.status IS DISTINCT FROM OLD.status` should prevent execution
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE id = (SELECT activity_id FROM temporal.send_earn_deposits WHERE workflow_id = 'test-update-workflow-1') $$,
    $$ VALUES ('temporal_send_earn_deposit'::text) $$,
    'Test 3.2: Activity event_name remains "pending" when only non-status fields change'
);

-- Clean up (No need to deallocate if we didn't prepare)
SELECT * FROM finish();

ROLLBACK;
