BEGIN;

-- Plan the number of tests to run
SELECT plan(23);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create test users
SELECT tests.create_supabase_user('notif_user');
SELECT tests.create_supabase_user('notif_user_other');

-- Authenticate as the test user
SELECT tests.authenticate_as('notif_user');

-- ============================================
-- NOTIFICATIONS TABLE TESTS
-- ============================================

-- Test inserting a valid notification
SELECT lives_ok(
    $$
    INSERT INTO public.notifications(user_id, type, title, body, data)
    VALUES (
        tests.get_supabase_uid('notif_user'),
        'transfer_received',
        'You received a transfer',
        'Someone sent you money!',
        '{"amount": "100", "sender": "0x123"}'::jsonb
    ) $$,
    'Insert a valid notification'
);

-- Test that user can view their own notifications
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = tests.get_supabase_uid('notif_user')
    $$,
    $$VALUES (1)$$,
    'User can view their own notifications'
);

-- Test updating own notification (mark as read)
SELECT lives_ok(
    $$
    UPDATE public.notifications
    SET read = true
    WHERE user_id = tests.get_supabase_uid('notif_user')
    $$,
    'User can update their own notifications'
);

-- Test deleting own notification
INSERT INTO public.notifications(user_id, type, title, body)
VALUES (
    tests.get_supabase_uid('notif_user'),
    'system',
    'Test notification',
    'This will be deleted'
);

SELECT lives_ok(
    $$
    DELETE FROM public.notifications
    WHERE user_id = tests.get_supabase_uid('notif_user')
      AND title = 'Test notification'
    $$,
    'User can delete their own notifications'
);

-- Test RLS: another user cannot view notifications
SELECT tests.authenticate_as('notif_user_other');

SELECT is_empty(
    $$
    SELECT * FROM public.notifications
    WHERE user_id = tests.get_supabase_uid('notif_user')
    $$,
    'Other user cannot view another user''s notifications'
);

-- Test RLS: another user cannot insert notification for first user
SELECT throws_ok(
    $$
    INSERT INTO public.notifications(user_id, type, title, body)
    VALUES (
        tests.get_supabase_uid('notif_user'),
        'system',
        'Malicious notification',
        'Should not be allowed'
    )
    $$,
    'new row violates row-level security policy for table "notifications"',
    'Other user cannot insert notifications for another user'
);

-- ============================================
-- PUSH_TOKENS TABLE TESTS
-- ============================================

SELECT tests.authenticate_as('notif_user');

-- Test inserting a valid expo push token
SELECT lives_ok(
    $$
    INSERT INTO public.push_tokens(user_id, platform, token)
    VALUES (
        tests.get_supabase_uid('notif_user'),
        'expo',
        'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
    )
    $$,
    'Insert a valid expo push token'
);

-- Test inserting a valid web push token
SELECT lives_ok(
    $$
    INSERT INTO public.push_tokens(user_id, platform, endpoint, p256dh, auth)
    VALUES (
        tests.get_supabase_uid('notif_user'),
        'web',
        'https://fcm.googleapis.com/fcm/send/example',
        'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
        'tBHItJI5svbpez7KI4CCXg'
    )
    $$,
    'Insert a valid web push token'
);

-- Test that user can view their own push tokens
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    FROM public.push_tokens
    WHERE user_id = tests.get_supabase_uid('notif_user')
    $$,
    $$VALUES (2)$$,
    'User can view their own push tokens'
);

-- Add a small delay to ensure updated_at will be different from created_at
SELECT pg_sleep(0.01);

-- Test updating own push token
SELECT lives_ok(
    $$
    UPDATE public.push_tokens
    SET token = 'ExponentPushToken[yyyyyyyyyyyyyyyyyyyy]'
    WHERE user_id = tests.get_supabase_uid('notif_user')
      AND platform = 'expo'
    $$,
    'User can update their own push tokens'
);

-- Test deleting own push token
SELECT lives_ok(
    $$
    DELETE FROM public.push_tokens
    WHERE user_id = tests.get_supabase_uid('notif_user')
      AND platform = 'web'
    $$,
    'User can delete their own push tokens'
);

-- Test RLS: another user cannot view push tokens
SELECT tests.authenticate_as('notif_user_other');

SELECT is_empty(
    $$
    SELECT * FROM public.push_tokens
    WHERE user_id = tests.get_supabase_uid('notif_user')
    $$,
    'Other user cannot view another user''s push tokens'
);

-- Test RLS: another user cannot insert push token for first user
SELECT throws_ok(
    $$
    INSERT INTO public.push_tokens(user_id, platform, token)
    VALUES (
        tests.get_supabase_uid('notif_user'),
        'expo',
        'ExponentPushToken[zzzzzzzzzzzzzzzzzzzz]'
    )
    $$,
    'new row violates row-level security policy for table "push_tokens"',
    'Other user cannot insert push tokens for another user'
);

-- Test unique constraint on expo token
SELECT tests.authenticate_as('notif_user');

SELECT throws_ok(
    $$
    INSERT INTO public.push_tokens(user_id, platform, token)
    VALUES (
        tests.get_supabase_uid('notif_user'),
        'expo',
        'ExponentPushToken[yyyyyyyyyyyyyyyyyyyy]'
    )
    $$,
    'duplicate key value violates unique constraint "push_tokens_user_platform_token_idx"',
    'Cannot insert duplicate expo token for same user'
);

-- Test updated_at trigger on push_tokens
SELECT results_eq(
    $$
    SELECT (updated_at > created_at)::boolean
    FROM public.push_tokens
    WHERE user_id = tests.get_supabase_uid('notif_user')
      AND platform = 'expo'
    $$,
    $$VALUES (true)$$,
    'updated_at should be greater than created_at after update'
);

-- ============================================
-- SECURITY TESTS: RPC FUNCTIONS
-- Verify that RPC functions derive user identity from auth.uid()
-- and cannot be used for cross-user attacks
-- ============================================

-- Test register_push_token RPC: uses auth.uid() internally
SELECT tests.authenticate_as('notif_user');

-- Delete any existing tokens first to avoid conflicts
DELETE FROM public.push_tokens WHERE user_id = tests.get_supabase_uid('notif_user');

-- Test that register_push_token works for the authenticated user
SELECT lives_ok(
    $$
    SELECT * FROM public.register_push_token(
        'ExponentPushToken[securitytesttoken1]',
        'expo',
        'device-123'
    )
    $$,
    'register_push_token RPC works for authenticated user'
);

-- Verify the token was registered with the correct user_id (auth.uid())
SELECT results_eq(
    $$
    SELECT user_id = tests.get_supabase_uid('notif_user')
    FROM public.push_tokens
    WHERE token = 'ExponentPushToken[securitytesttoken1]'
    $$,
    $$VALUES (true)$$,
    'register_push_token uses auth.uid() for user_id'
);

-- register_push_token is for Expo tokens only (web uses upsert_web_push_token)
SELECT throws_ok(
    $$
    SELECT * FROM public.register_push_token(
        'https://fcm.googleapis.com/fcm/send/not-a-token',
        'web',
        NULL
    )
    $$,
    'Use upsert_web_push_token for web push subscriptions',
    'register_push_token rejects web platform'
);

-- Test upsert_web_push_token RPC: uses auth.uid() internally
SELECT lives_ok(
    $$
    SELECT public.upsert_web_push_token(
        'https://fcm.googleapis.com/fcm/send/security-test',
        'test-p256dh-key',
        'test-auth-key'
    )
    $$,
    'upsert_web_push_token RPC works for authenticated user'
);

-- Verify the web push token was registered with the correct user_id
SELECT results_eq(
    $$
    SELECT user_id = tests.get_supabase_uid('notif_user')
    FROM public.push_tokens
    WHERE endpoint = 'https://fcm.googleapis.com/fcm/send/security-test'
    $$,
    $$VALUES (true)$$,
    'upsert_web_push_token uses auth.uid() for user_id'
);

-- Test that other user cannot see tokens registered via RPC
SELECT tests.authenticate_as('notif_user_other');

SELECT is_empty(
    $$
    SELECT * FROM public.push_tokens
    WHERE token = 'ExponentPushToken[securitytesttoken1]'
    $$,
    'Other user cannot see tokens registered by first user via RPC'
);

-- Test that unauthenticated users cannot use register_push_token
SELECT tests.clear_authentication();

SELECT throws_ok(
    $$
    SELECT * FROM public.register_push_token(
        'ExponentPushToken[unauthtoken]',
        'expo',
        NULL
    )
    $$,
    'User must be authenticated to register push token',
    'register_push_token rejects unauthenticated users'
);

-- Test that unauthenticated users cannot use upsert_web_push_token
SELECT throws_ok(
    $$
    SELECT public.upsert_web_push_token(
        'https://fcm.googleapis.com/fcm/send/unauth-test',
        'unauth-p256dh',
        'unauth-auth'
    )
    $$,
    'User must be authenticated to register web push token',
    'upsert_web_push_token rejects unauthenticated users'
);

-- Complete the tests
SELECT finish();

ROLLBACK;
