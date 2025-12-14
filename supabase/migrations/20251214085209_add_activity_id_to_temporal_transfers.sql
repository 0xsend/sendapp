-- Phase 1: Add activity_id to temporal.send_account_transfers
-- This migration adds the activity_id column to track pending activities
-- created by the temporal trigger, mirroring the deposit workflow pattern.

-- Add activity_id column
ALTER TABLE temporal.send_account_transfers
ADD COLUMN activity_id BIGINT;

-- Add foreign key constraint to public.activity with CASCADE delete
ALTER TABLE temporal.send_account_transfers
ADD CONSTRAINT fk_transfer_activity
FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON DELETE CASCADE;

-- Create index for efficient queries on activity_id
CREATE INDEX idx_temporal_send_account_transfers_activity_id
ON temporal.send_account_transfers USING btree (activity_id);

-- Update the temporal.sql schema file comment
COMMENT ON COLUMN temporal.send_account_transfers.activity_id IS 'References pending activity created when status=sent, deleted by indexer trigger';
