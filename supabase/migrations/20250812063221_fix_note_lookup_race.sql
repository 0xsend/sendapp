-- Fix race condition in update_transfer_activity_before_insert() 
-- Add fallback lookup by workflow_id when event_id/event_name link not established yet

CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
DECLARE
    note text;
    temporal_event_id text;
BEGIN
    IF (
    NEW.event_name = 'send_account_transfers'
    OR NEW.event_name = 'send_account_receives'
    )
    AND NEW.from_user_id IS NOT NULL
    AND NEW.to_user_id IS NOT NULL
    THEN
        -- Primary lookup: match by exact event_id and event_name
        SELECT
            data->>'note', send_account_transfers_activity_event_id INTO note, temporal_event_id
        FROM temporal.send_account_transfers t_sat
        WHERE t_sat.send_account_transfers_activity_event_id = NEW.event_id
        AND t_sat.send_account_transfers_activity_event_name = NEW.event_name;

        -- Fallback lookup: if primary fails, try matching by workflow_id
        IF note IS NULL THEN
            SELECT
                data->>'note', send_account_transfers_activity_event_id INTO note, temporal_event_id
            FROM temporal.send_account_transfers t_sat
            WHERE NEW.event_id LIKE '%' || t_sat.workflow_id || '%'
            AND t_sat.data->>'tx_hash' IS NOT NULL
            ORDER BY t_sat.updated_at DESC
            LIMIT 1;
        END IF;

        IF note IS NOT NULL THEN
            NEW.data = NEW.data || jsonb_build_object('note', note);
        END IF;

        -- NOTE: Removed temporal activity cleanup logic - now handled by workflow
    END IF;
    RETURN NEW;
END;
$function$;
