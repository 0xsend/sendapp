set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_tag(tag_name citext, send_account_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _tag_id bigint;
    _original_error_code text;
    _original_error_message text;
BEGIN
    BEGIN
        -- Verify user owns the send_account
        IF NOT EXISTS (
            SELECT
                1
            FROM
                send_accounts
            WHERE
                id = send_account_id
                AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'User does not own this send_account';
    END IF;
    -- Check tag count before insert
    IF (
        SELECT
            COUNT(*)
        FROM
            tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE
            sa.user_id = auth.uid()) >= 5 THEN
        RAISE EXCEPTION 'User can have at most 5 tags';
    END IF;
    -- Check if tag exists and is available
    WITH available_tag AS (
        UPDATE
            tags
        SET
            status = 'pending',
            user_id = auth.uid(),
            updated_at = NOW()
        WHERE
            name = tag_name
            AND status = 'available'
        RETURNING
            id
),
new_tag AS (
INSERT INTO tags(name, status, user_id)
    SELECT
        tag_name,
        'pending',
        auth.uid()
    WHERE
        NOT EXISTS (
            SELECT
                1
            FROM
                available_tag)
        RETURNING
            id)
    INSERT INTO send_account_tags(send_account_id, tag_id)
    SELECT
        send_account_id,
        id
    FROM (
        SELECT
            id
        FROM
            available_tag
        UNION ALL
        SELECT
            id
        FROM
            new_tag) tags
RETURNING
    tag_id INTO _tag_id;
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS
                _original_error_code = RETURNED_SQLSTATE,
                _original_error_message = MESSAGE_TEXT;
            RAISE EXCEPTION USING
                ERRCODE = _original_error_code,
                MESSAGE = _original_error_message;
    END;
    RETURN _tag_id;
END;
$function$
;


