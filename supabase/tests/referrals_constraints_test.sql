-- Test suite for the public.referrals table constraints
BEGIN;

SELECT plan(3); -- Number of tests

-- 1. Setup: Create users for testing
-- Insert into auth.users first (Supabase trigger should create the profile)
INSERT INTO auth.users (id, email, role, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'referrer@example.com', 'authenticated', now(), now()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'referred1@example.com', 'authenticated', now(), now()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'referred2@example.com', 'authenticated', now(), now());

-- 2. Test Case 1: Insert a valid referral
-- Expect: Success
SELECT lives_ok(
    $$ INSERT INTO public.referrals (referrer_id, referred_id) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') $$,
    'Test 1: Should be able to insert a unique referral'
);

-- 3. Test Case 2: Insert a duplicate referral (same referrer, same referred)
-- Expect: Failure due to unique constraint
SELECT throws_ok(
    $$ INSERT INTO public.referrals (referrer_id, referred_id) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') $$,
    '23505', -- unique_violation
    NULL, -- No specific error message check needed
    'Test 2: Should fail to insert a duplicate referral (same referrer, same referred)'
);

-- 4. Test Case 3: Insert a different referral (same referrer, different referred)
-- Expect: Success
SELECT lives_ok(
    $$ INSERT INTO public.referrals (referrer_id, referred_id) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13') $$,
    'Test 3: Should be able to insert a referral with the same referrer but different referred'
);

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
