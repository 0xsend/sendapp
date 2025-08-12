-- Remove temporal cleanup triggers and functions
-- This migration removes the trigger-based cleanup logic that was causing timing issues
-- The cleanup will now be handled by the workflow after confirmation

-- Drop the triggers first
DROP TRIGGER IF EXISTS "temporal_send_account_transfers_trigger_update_transfer_activit" ON "public"."activity";
DROP TRIGGER IF EXISTS "send_account_transfers_trigger_delete_temporal_activity" ON "public"."send_account_transfers";

-- Replace the update_transfer_activity_before_insert function with a version that only handles note enrichment
CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
DECLARE
    note text;
BEGIN
    IF (
    NEW.event_name = 'send_account_transfers'
    OR NEW.event_name = 'send_account_receives'
    )
    AND NEW.from_user_id IS NOT NULL
    AND NEW.to_user_id IS NOT NULL
    THEN
        SELECT
            data->>'note' INTO note
        FROM temporal.send_account_transfers t_sat
        WHERE t_sat.send_account_transfers_activity_event_id = NEW.event_id
        AND t_sat.send_account_transfers_activity_event_name = NEW.event_name;

        IF note IS NOT NULL THEN
            NEW.data = NEW.data || jsonb_build_object('note', note);
        END IF;

        -- NOTE: Removed temporal activity cleanup logic - now handled by workflow
    END IF;
    RETURN NEW;
END;
$function$;

-- Recreate the trigger for activity note enrichment (without cleanup)
CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_update_transfer_activit" 
BEFORE INSERT ON "public"."activity" 
FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_activity_before_insert"();

-- Drop the send_account_transfers_delete_temporal_activity function since it's no longer needed
DROP FUNCTION IF EXISTS "public"."send_account_transfers_delete_temporal_activity"();
