set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_delete_tag(p_send_account_id uuid, p_tag_id bigint DEFAULT NULL::bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    WITH tag_info AS (
        SELECT
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1
                FROM tag_receipts tr
                JOIN receipts r ON r.event_id = tr.event_id
                WHERE tr.tag_id = t.id
                AND r.user_id = t.user_id  -- Ensure receipt belongs to current tag owner
            ))::integer as paid_tag_count,
            CASE
                WHEN p_tag_id IS NULL THEN false
                ELSE bool_or(t.id = p_tag_id AND EXISTS (
                    SELECT 1
                    FROM tag_receipts tr
                    JOIN receipts r ON r.event_id = tr.event_id
                    WHERE tr.tag_id = p_tag_id
                    AND r.user_id = t.user_id  -- Ensure receipt belongs to current tag owner
                ))
            END as is_deleting_paid_tag
        FROM send_account_tags sat
        JOIN tags t ON t.id = sat.tag_id
        WHERE sat.send_account_id = p_send_account_id
        AND t.status = 'confirmed'
    )
    SELECT CASE
        -- If no tag_id provided, check if user can delete any tag (has >= 2 paid tags)
        WHEN p_tag_id IS NULL THEN paid_tag_count >= 2
        -- If tag_id provided, check if this specific tag can be deleted
        WHEN is_deleting_paid_tag AND paid_tag_count <= 1 THEN false
        ELSE true
    END
    FROM tag_info
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_last_confirmed_tag_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if this deletion would leave the user with zero PAID confirmed tags
    -- Only prevent deletion if the tag being deleted is confirmed AND has a receipt (paid)
    IF current_setting('role')::text = 'authenticated' AND
        (SELECT status FROM tags WHERE id = OLD.tag_id) = 'confirmed' THEN

        -- Count remaining PAID confirmed tags after this deletion
        -- A paid tag is one that has a receipt (not the free first sendtag)
        IF (SELECT COUNT(*)
            FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            WHERE sat.send_account_id = OLD.send_account_id
            AND t.status = 'confirmed'
            AND sat.tag_id != OLD.tag_id
            AND EXISTS (
                SELECT 1
                FROM tag_receipts tr
                JOIN receipts r ON r.event_id = tr.event_id
                WHERE tr.tag_id = t.id
                AND r.user_id = t.user_id  -- Ensure receipt belongs to current tag owner
            )) = 0 THEN
            RAISE EXCEPTION 'Cannot delete this sendtag. You must maintain at least one paid sendtag.';
        END IF;
    END IF;

    RETURN OLD;
END;
$function$
;


