-- Migration script to update existing sendpot_ticket_purchase verifications
-- This converts weight from BPS to ticket-count-based calculation
-- and adds the 'value' field to metadata

DO $$
DECLARE
    updated_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting migration of sendpot_ticket_purchase verifications...';
    
    -- Update all existing sendpot_ticket_purchase verifications
    WITH ticket_data AS (
        SELECT
            dv.id,
            dv.user_id,
            dv.distribution_id,
            dv.metadata->>'lastJackpotEndTime' AS last_jackpot_end_time,
            d.qualification_start,
            d.qualification_end,
            COALESCE(d.sendpot_ticket_increment, 10) AS increment
        FROM distribution_verifications dv
        JOIN distributions d ON d.id = dv.distribution_id
        WHERE dv.type = 'sendpot_ticket_purchase'
    ),
    calculated_tickets AS (
        SELECT
            td.id,
            td.increment,
            td.last_jackpot_end_time,
            sa.address_bytes AS buyer,
            COALESCE(
                SUM(utp.tickets_purchased_count),
                0
            ) AS total_tickets
        FROM ticket_data td
        JOIN send_accounts sa ON sa.user_id = td.user_id
        LEFT JOIN sendpot_user_ticket_purchases utp ON utp.buyer = sa.address_bytes
            AND utp.block_time >= EXTRACT(EPOCH FROM td.qualification_start)
            AND utp.block_time < EXTRACT(EPOCH FROM td.qualification_end)
            AND utp.block_time > (td.last_jackpot_end_time::numeric)
        GROUP BY td.id, td.increment, td.last_jackpot_end_time, sa.address_bytes
    )
    UPDATE distribution_verifications dv
    SET
        weight = FLOOR(ct.total_tickets / ct.increment),
        metadata = jsonb_build_object(
            'lastJackpotEndTime', ct.last_jackpot_end_time::numeric,
            'value', ct.total_tickets
        )
    FROM calculated_tickets ct
    WHERE dv.id = ct.id
        AND dv.type = 'sendpot_ticket_purchase';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Migration complete. Updated % sendpot_ticket_purchase verification rows', updated_count;
    
    -- Verification checks
    RAISE NOTICE 'Running verification checks...';
    
    -- Check for rows missing the value field
    DECLARE
        missing_value_count integer;
    BEGIN
        SELECT COUNT(*) INTO missing_value_count
        FROM distribution_verifications
        WHERE type = 'sendpot_ticket_purchase'
            AND metadata->>'value' IS NULL;
        
        IF missing_value_count > 0 THEN
            RAISE WARNING 'Found % rows still missing the value field in metadata', missing_value_count;
        ELSE
            RAISE NOTICE 'All rows have the value field in metadata';
        END IF;
    END;
    
END $$;

-- Display sample of updated rows
SELECT
    id,
    user_id,
    distribution_id,
    weight,
    metadata->'lastJackpotEndTime' AS last_jackpot,
    metadata->'value' AS ticket_count,
    created_at
FROM distribution_verifications
WHERE type = 'sendpot_ticket_purchase'
ORDER BY created_at DESC
LIMIT 10;
