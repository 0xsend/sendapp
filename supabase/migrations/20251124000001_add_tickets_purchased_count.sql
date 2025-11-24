-- Add tickets_purchased_count column to track incremental tickets per transaction
-- This column stores the actual number of tickets purchased in THIS specific transaction
-- (as opposed to tickets_purchased_total_bps which is cumulative)

ALTER TABLE public.sendpot_user_ticket_purchases
ADD COLUMN IF NOT EXISTS tickets_purchased_count numeric;

-- Add comment for clarity
COMMENT ON COLUMN public.sendpot_user_ticket_purchases.tickets_purchased_count
IS 'The number of tickets purchased in this specific transaction (incremental, not cumulative). Calculated using historical feeBps values.';
