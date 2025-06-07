-- Function to atomically register a user's first sendtag
-- This combines create_tag, confirm_tags, and main tag assignment in a single transaction
-- This function is meant to be called by the service role
CREATE OR REPLACE FUNCTION public.register_first_sendtag(tag_name citext, send_account_id uuid, _referral_code text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _tag_id bigint;
    _user_id uuid;
    _referrer_id uuid;
    _send_account record;
    _send_account_id ALIAS FOR send_account_id;
BEGIN
    -- Get the authenticated user ID
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Verify send account belongs to user and get current state
    SELECT id, main_tag_id, user_id INTO _send_account
    FROM send_accounts
    WHERE id = _send_account_id AND user_id = _user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Send account not found or does not belong to user';
    END IF;

    -- Check if user already has confirmed tags (first sendtag validation)
    IF EXISTS (
        SELECT 1
        FROM tags t
        JOIN send_account_tags sat ON sat.tag_id = t.id
        WHERE sat.send_account_id = _send_account.id
        AND t.status = 'confirmed'
    ) THEN
        RAISE EXCEPTION 'User already has confirmed sendtags';
    END IF;

    -- Create or reuse tag (following create_tag logic)
    WITH available_tag AS (
        UPDATE tags
        SET status = 'pending',
            user_id = _user_id,
            updated_at = NOW()
        WHERE name = tag_name
        AND status = 'available'
        RETURNING id
    ),
    new_tag AS (
        INSERT INTO tags(name, status, user_id)
        SELECT tag_name, 'pending', _user_id
        WHERE NOT EXISTS (SELECT 1 FROM available_tag)
        RETURNING id
    )
    SELECT COALESCE(a.id, n.id) INTO _tag_id
    FROM available_tag a
    FULL OUTER JOIN new_tag n ON true;

    -- Create send_account_tags association
    INSERT INTO send_account_tags(send_account_id, tag_id)
    VALUES (_send_account.id, _tag_id);

    -- Immediately confirm the tag (since it's a free first sendtag)
    -- The trigger will now allow this for first sendtag
    UPDATE tags
    SET status = 'confirmed'
    WHERE id = _tag_id;

    -- Set as main tag if user has no main tag
    IF _send_account.main_tag_id IS NULL THEN
        UPDATE send_accounts
        SET main_tag_id = _tag_id
        WHERE id = _send_account.id;
    END IF;

    -- Handle referral if provided
    IF _referral_code IS NOT NULL AND _referral_code <> '' THEN
        SELECT id INTO _referrer_id
        FROM profiles
        WHERE referral_code = _referral_code;

        IF _referrer_id IS NOT NULL AND _referrer_id != _user_id THEN
            -- Check if a referral already exists for this user
            IF NOT EXISTS (
                SELECT 1
                FROM referrals
                WHERE referred_id = _user_id
            ) THEN
                -- Insert referral
                INSERT INTO referrals(referrer_id, referred_id)
                VALUES (_referrer_id, _user_id);
            END IF;
        END IF;
    END IF;

    -- Return success with tag details
    RETURN json_build_object(
        'success', true,
        'tag_id', _tag_id,
        'tag_name', tag_name,
        'is_main_tag', (_send_account.main_tag_id IS NULL)
    );
END;
$function$
;
