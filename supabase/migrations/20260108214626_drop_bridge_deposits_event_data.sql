-- Drop event_data column from bridge_deposits
-- This data is redundant with bridge_webhook_events.payload and was exposed to users
-- For debugging, use bridge_webhook_events which is service_role only

ALTER TABLE "public"."bridge_deposits" DROP COLUMN IF EXISTS "event_data";
