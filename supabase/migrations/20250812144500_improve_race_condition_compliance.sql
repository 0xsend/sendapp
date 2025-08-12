-- Improve race condition fix compliance with audit specifications
-- Add better defensive checks, more precise SQL patterns, and edge case handling

CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
DECLARE
    note text;
    temporal_event_id text;
    workflow_pattern text;
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

        -- Fallback lookup: if primary fails, try matching by workflow_id with improved pattern matching
        IF note IS NULL THEN
            -- Defensive check: only proceed if event_id looks like a valid blockchain event pattern
            -- and contains what appears to be a temporal workflow ID
            IF NEW.event_id ~ '^[a-zA-Z0-9_/]+/base_logs/[0-9]+/[0-9]+/[0-9]+$'
            AND NEW.event_id ~ 'temporal/transfer/[^/]+/[^/]+' THEN
                
                -- Extract potential workflow ID from event_id using more precise pattern matching
                -- Look for 'temporal/transfer/' followed by user_id and user_op_hash
                SELECT
                    data->>'note', send_account_transfers_activity_event_id INTO note, temporal_event_id
                FROM temporal.send_account_transfers t_sat
                WHERE t_sat.data->>'tx_hash' IS NOT NULL
                AND t_sat.status IN ('confirmed', 'sent')  -- Additional safety check
                AND NEW.event_id LIKE '%' || t_sat.workflow_id || '%'
                AND LENGTH(t_sat.workflow_id) >= 10  -- Defensive check: workflow_id should be reasonable length
                AND t_sat.workflow_id ~ '^temporal/transfer/[^/]+/0x[a-fA-F0-9]{64}$'  -- Validate workflow_id format
                ORDER BY t_sat.updated_at DESC
                LIMIT 1;
                
                -- Additional fallback: try matching by embedded workflow components
                IF note IS NULL THEN
                    SELECT
                        data->>'note', send_account_transfers_activity_event_id INTO note, temporal_event_id
                    FROM temporal.send_account_transfers t_sat
                    WHERE t_sat.data->>'tx_hash' IS NOT NULL
                    AND t_sat.status IN ('confirmed', 'sent')
                    -- Extract user_op_hash from workflow_id and check if it's in the event_id
                    AND NEW.event_id LIKE '%' || RIGHT(t_sat.workflow_id, 66) || '%'  -- Last 66 chars (0x + 64 hex chars)
                    AND t_sat.created_at >= NOW() - INTERVAL '1 hour'  -- Only consider recent workflows for safety
                    ORDER BY t_sat.updated_at DESC
                    LIMIT 1;
                END IF;
            END IF;
        END IF;

        -- Apply note if found, with additional validation
        IF note IS NOT NULL AND note != '' AND LENGTH(note) <= 1000 THEN  -- Defensive length check
            NEW.data = NEW.data || jsonb_build_object('note', note);
        END IF;

        -- NOTE: Temporal activity cleanup logic is now handled by workflow
        -- This separation ensures better timing control and prevents race conditions
    END IF;
    RETURN NEW;
END;
$function$;

-- Add comment for audit trail
COMMENT ON FUNCTION public.update_transfer_activity_before_insert() IS 
'Race condition fix with enhanced defensive checks and precise pattern matching.
Implements multiple fallback strategies for note lookup while preventing false positives.
Includes validation for workflow_id format, event_id structure, and note content.
Updated: 2025-08-12 for audit compliance';
