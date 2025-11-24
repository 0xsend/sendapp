BEGIN;

SELECT plan(12); -- Adjust plan count as needed

-- Create the necessary extensions
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Create test users
SELECT tests.create_supabase_user('user_a');
SELECT tests.create_supabase_user('user_b');

-- Get user IDs
SELECT tests.get_supabase_uid('user_a') AS user_a_id \gset
SELECT tests.get_supabase_uid('user_b') AS user_b_id \gset

-- Setup test accounts for users
INSERT INTO public.send_accounts (user_id, address, chain_id, init_code)
VALUES
    (:'user_a_id', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1, '\\x01'),
    (:'user_b_id', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 1, '\\x02');

SELECT is_empty(
    $$ SELECT 1 FROM public.get_user_jackpot_summary(0) $$,
    'Summary Function: Test with num_runs = 0 should return empty'
);
TRUNCATE public.sendpot_jackpot_runs RESTART IDENTITY CASCADE;
TRUNCATE public.sendpot_user_ticket_purchases RESTART IDENTITY CASCADE;
SELECT is_empty(
    $$ SELECT 1 FROM public.get_user_jackpot_summary(5) $$,
    'Summary Function: Test with no data should return empty'
);

-- Mock data for sendpot_user_ticket_purchases
-- Note: With feeBps=3000 (blocks < 38567474), net BPS per ticket = 7000
-- So to get N tickets delta, we need BPS delta of N * 7000
-- Trigger calculates: tickets = FLOOR((current_bps - prev_bps) / 7000)
INSERT INTO public.sendpot_user_ticket_purchases (
    chain_id, log_addr, block_time, tx_hash, referrer, value, recipient, buyer, tickets_purchased_total_bps, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) VALUES
    -- User A: cumulative BPS designed to give specific ticket deltas
    (1, '\x01', 1000, '\x01', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 100, '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 70000, 'ig1', 'src1', 50, 1, 1, 1),    -- Run 1: delta=70000 -> 10 tickets
    (1, '\x01', 1100, '\x02', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 200, '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 210000, 'ig1', 'src1', 100, 1, 1, 1),   -- Run 2: delta=140000 -> 20 tickets
    (1, '\x01', 1100, '\x02', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 200, '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 350000, 'ig1', 'src1', 150, 1, 1, 1),   -- Run 2: delta=140000 -> 20 tickets (total 40 for run 2)
    -- User B: separate buyer, own cumulative sequence
    (1, '\x01', 1200, '\x03', NULL, 300, '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 210000, 'ig1', 'src1', 50, 1, 1, 2),    -- Run 1: delta=210000 -> 30 tickets
    -- User A continues
    (1, '\x01', 2100, '\x04', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 400, '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 630000, 'ig1', 'src1', 200, 1, 1, 1),   -- Run 3: delta=280000 -> 40 tickets
    -- User B continues
    (1, '\x01', 2200, '\x05', NULL, 500, '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 350000, 'ig1', 'src1', 250, 1, 1, 1),   -- Run 2: delta=140000 -> 20 tickets
    -- User A pending
    (1, '\x01', 3100, '\x06', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 600, '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1050000, 'ig1', 'src1', 310, 1, 1, 1); -- Pending: delta=420000 -> 60 tickets

-- Mock data for sendpot_jackpot_runs
INSERT INTO public.sendpot_jackpot_runs (
    chain_id, log_addr, block_time, tx_hash, time, winner, winning_ticket, win_amount, tickets_purchased_total_bps, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) VALUES
    (1, '\x01', 1000, '\x11', 1000, '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1, 50, 60, 'ig1', 'src1', 100, 1, 1, 1), -- Run 1
    (1, '\x01', 2000, '\x22', 2000, '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 2, 80, 90, 'ig1', 'src1', 200, 1, 1, 1), -- Run 2
    (1, '\x01', 3000, '\x33', 3000, '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 3, 50, 60, 'ig1', 'src1', 300, 1, 1, 1); -- Run 3

-- =============================================================================
-- Test tickets_purchased_count trigger calculation
-- =============================================================================
-- Verify the trigger correctly calculates tickets from BPS delta using fee history
-- With feeBps=3000 (blocks < 38567474), net BPS per ticket = 7000
SELECT results_eq(
    $$ SELECT buyer, block_num, tickets_purchased_total_bps, tickets_purchased_count
       FROM public.sendpot_user_ticket_purchases
       WHERE buyer = '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
       ORDER BY block_num $$,
    $$ VALUES ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 50::numeric,  70000::numeric, 10::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 100::numeric, 210000::numeric, 20::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 150::numeric, 350000::numeric, 20::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 200::numeric, 630000::numeric, 40::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 310::numeric, 1050000::numeric, 60::numeric) $$,
    'Trigger: User A tickets_purchased_count calculated correctly from BPS delta'
);

SELECT results_eq(
    $$ SELECT buyer, block_num, tickets_purchased_total_bps, tickets_purchased_count
       FROM public.sendpot_user_ticket_purchases
       WHERE buyer = '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
       ORDER BY block_num $$,
    $$ VALUES ('\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea, 50::numeric, 210000::numeric, 30::numeric),
              ('\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea, 250::numeric, 350000::numeric, 20::numeric) $$,
    'Trigger: User B tickets_purchased_count calculated correctly from BPS delta'
);

-- Test with different feeBps (after block 38567474, feeBps = 7000, net BPS per ticket = 3000)
-- Create a new buyer for this test to have clean cumulative sequence
INSERT INTO public.sendpot_user_ticket_purchases (
    chain_id, log_addr, block_time, tx_hash, referrer, value, recipient, buyer, tickets_purchased_total_bps, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) VALUES
    -- User C: purchases after fee change (block >= 38567474), feeBps = 7000, net = 3000 BPS/ticket
    (1, '\x01', 5000, '\x07', NULL, 700, '\xcccccccccccccccccccccccccccccccccccccccc', '\xcccccccccccccccccccccccccccccccccccccccc', 9000, 'ig1', 'src1', 39000000, 1, 1, 1),   -- delta=9000 -> 3 tickets (9000/3000)
    (1, '\x01', 5100, '\x08', NULL, 800, '\xcccccccccccccccccccccccccccccccccccccccc', '\xcccccccccccccccccccccccccccccccccccccccc', 21000, 'ig1', 'src1', 39100000, 1, 1, 1);  -- delta=12000 -> 4 tickets (12000/3000)

SELECT results_eq(
    $$ SELECT buyer, block_num, tickets_purchased_total_bps, tickets_purchased_count
       FROM public.sendpot_user_ticket_purchases
       WHERE buyer = '\xcccccccccccccccccccccccccccccccccccccccc'
       ORDER BY block_num $$,
    $$ VALUES ('\xcccccccccccccccccccccccccccccccccccccccc'::bytea, 39000000::numeric, 9000::numeric, 3::numeric),
              ('\xcccccccccccccccccccccccccccccccccccccccc'::bytea, 39100000::numeric, 21000::numeric, 4::numeric) $$,
    'Trigger: User C tickets calculated with higher feeBps (7000) after block 38567474'
);

-- =============================================================================
-- Test RLS on sendpot_user_ticket_purchases
-- =============================================================================

-- Test 1: User A can see their own ticket purchases
SELECT tests.authenticate_as('user_a');
SELECT results_eq(
    $$ SELECT recipient, block_num, tickets_purchased_total_bps FROM public.sendpot_user_ticket_purchases ORDER BY block_num $$,
    $$ VALUES ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 50::numeric,  70000::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 100::numeric, 210000::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 150::numeric, 350000::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 200::numeric, 630000::numeric),
              ('\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea, 310::numeric, 1050000::numeric) $$,
    'RLS: User A should see only their ticket purchases'
);
SELECT tests.clear_authentication();

-- Test 2: User B can see their own ticket purchases
SELECT tests.authenticate_as('user_b');
SELECT results_eq(
    $$ SELECT recipient, block_num, tickets_purchased_total_bps FROM public.sendpot_user_ticket_purchases ORDER BY block_num $$,
    $$ VALUES ('\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea, 50::numeric, 210000::numeric),
              ('\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea, 250::numeric, 350000::numeric) $$,
    'RLS: User B should see only their ticket purchases'
);
SELECT tests.clear_authentication();

-- Test 3: Anonymous user cannot see any ticket purchases
SET ROLE anon;
SELECT is_empty(
    $$ SELECT 1 FROM public.sendpot_user_ticket_purchases $$,
    'RLS: Anonymous user should not see any ticket purchases'
);
RESET ROLE;

-- =============================================================================
-- Test get_user_jackpot_summary function
-- =============================================================================
SELECT tests.authenticate_as('user_a');
-- Test 4: Summary with num_runs = 3
-- Run 1 (block 100): purchases at block 50 only -> 10 tickets
-- Run 2 (block 200): purchases at blocks 100, 150 -> 20 + 20 = 40 tickets
-- Run 3 (block 300): purchases at block 200 -> 40 tickets
SELECT results_eq(
    $$ SELECT jackpot_run_id, jackpot_block_num, total_tickets FROM public.get_user_jackpot_summary(3) ORDER BY jackpot_run_id DESC $$,
    $$ VALUES (3, 300::numeric, 40::numeric),
              (2, 200::numeric, 40::numeric),
              (1, 100::numeric, 10::numeric)
    $$,
    'Summary Function: Test with num_runs = 3'
);

-- Test 5: Summary with num_runs = 2
SELECT results_eq(
    $$ SELECT jackpot_run_id, jackpot_block_num, total_tickets FROM public.get_user_jackpot_summary(2) ORDER BY jackpot_run_id DESC $$,
    $$ VALUES (3, 300::numeric, 40::numeric),
              (2, 200::numeric, 40::numeric)
    $$,
    'Summary Function: Test with num_runs = 2'
);

-- Test 6: Summary with num_runs = 1
SELECT results_eq(
    $$ SELECT jackpot_run_id, jackpot_block_num, total_tickets FROM public.get_user_jackpot_summary(1) ORDER BY jackpot_run_id DESC $$,
    $$ VALUES (3, 300::numeric, 40::numeric)
    $$,
    'Summary Function: Test with num_runs = 1'
);

-- Test 7: Pending tickets sum for User A after Run 3
-- Purchases after last jackpot (block 300): block 310 -> 60 tickets
SELECT results_eq(
    $$ SELECT public.get_pending_jackpot_tickets_purchased() $$,
    $$ VALUES (60::numeric) $$,
    'Pending Tickets Function: User A should have 60 tickets pending after Run 3 (block 300)'
);

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
