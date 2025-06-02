drop function if exists "public"."confirm_tags"(tag_names citext[], event_id text, referral_code_input text);

drop function if exists "public"."confirm_tags"(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text);

CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _sender bytea;
    _user_id uuid;
    _send_account_id ALIAS FOR send_account_id;
    referrer_id uuid;
BEGIN
    -- Get the sender from the receipt
    SELECT
        scr.sender,
        sa.user_id INTO _sender,
        _user_id
    FROM
        sendtag_checkout_receipts scr
        JOIN send_accounts sa ON decode(substring(sa.address, 3), 'hex') = scr.sender
    WHERE
        scr.event_id = _event_id;
    -- Verify the sender matches the send_account
    IF NOT EXISTS (
        SELECT
            1
        FROM
            send_accounts sa
        WHERE
            id = _send_account_id
            AND decode(substring(sa.address, 3), 'hex') = _sender) THEN
        RAISE EXCEPTION 'Receipt event ID does not match the sender';
    END IF;

    -- Create receipt
    INSERT INTO receipts(event_id, user_id)
        VALUES (_event_id, _user_id);
    -- First create send_account_tags entries
    INSERT INTO send_account_tags(send_account_id, tag_id)
    SELECT DISTINCT
        _send_account_id,
        t.id
    FROM
        tags t
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'pending'
        AND NOT EXISTS (
            SELECT
                1
            FROM
                send_account_tags sat
            WHERE
                sat.send_account_id = _send_account_id
                AND sat.tag_id = t.id);
    -- Then update tags status which will trigger the verification
    UPDATE
        tags
    SET
        status = 'confirmed'
    WHERE
        name = ANY (tag_names)
        AND status = 'pending';
    -- Associate tags with event
    INSERT INTO tag_receipts(tag_name, tag_id, event_id)
    SELECT
        t.name,
        t.id,
        _event_id
    FROM
        tags t
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'confirmed';
    -- Handle referral
    IF _referral_code IS NOT NULL AND _referral_code <> '' THEN
        SELECT
            id INTO referrer_id
        FROM
            public.profiles
        WHERE
            referral_code = _referral_code;
        IF referrer_id IS NOT NULL AND referrer_id != _user_id THEN
            -- Check if a referral already exists for this user
            IF NOT EXISTS (
                SELECT
                    1
                FROM
                    public.referrals
                WHERE
                    referred_id = _user_id) THEN
            -- Insert only one referral for the user
            INSERT INTO referrals(referrer_id, referred_id)
            VALUES (referrer_id, _user_id);
        END IF;
    END IF;
END IF;
END;
$function$
;
