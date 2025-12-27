-- Add balance_rank column to distribution_shares
-- This stores the user's rank position (0-based index) within the distribution cohort
-- The value represents where the user ranks among qualifying distribution participants after slashing,
-- with 0 being lowest and higher numbers representing higher effective balance
-- This rank is calculated for all distribution modes, not just sigmoid
-- Clients can calculate percentile or other transformations using: (rank / (total_count - 1)) * 100

ALTER TABLE "public"."distribution_shares"
ADD COLUMN IF NOT EXISTS "balance_rank" integer;

COMMENT ON COLUMN "public"."distribution_shares"."balance_rank" IS 'User rank position (0-based index) within the distribution cohort based on effective balance rank after qualification and slashing. Clients can calculate percentile using: (rank / (total_count - 1)) * 100';
