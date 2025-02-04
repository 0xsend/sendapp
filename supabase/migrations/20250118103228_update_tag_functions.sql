-- First, set up the tables and their RLS
ALTER TABLE public.send_account_tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tag_receipts ENABLE ROW LEVEL SECURITY;

-- Remove default value from user_id
ALTER TABLE public.tags
    ALTER COLUMN user_id DROP DEFAULT;

-- Drop all existing policies
DROP POLICY IF EXISTS "select_policy" ON public.tags;

DROP POLICY IF EXISTS "insert_policy" ON public.tags;

DROP POLICY IF EXISTS "update_policy" ON public.tags;

DROP POLICY IF EXISTS "delete_policy" ON public.tags;

DROP POLICY IF EXISTS "Users can read confirmed tags" ON public.tags;

DROP POLICY IF EXISTS "select_policy" ON public.send_account_tags;

DROP POLICY IF EXISTS "insert_policy" ON public.send_account_tags;

DROP POLICY IF EXISTS "update_policy" ON public.send_account_tags;

DROP POLICY IF EXISTS "delete_policy" ON public.send_account_tags;

DROP POLICY IF EXISTS "select_policy" ON public.tag_receipts;

-- Create simplified policies for tags table
CREATE POLICY "select_policy" ON public.tags
    FOR SELECT
        USING (status = 'available' -- Anyone can see available tags
            OR EXISTS ( -- Or pending / confirmed tags they own through send_account
                SELECT
                    1
                FROM
                    send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                WHERE
                    sat.tag_id = tags.id AND sa.user_id = auth.uid()));

CREATE POLICY "insert_policy" ON public.tags
    FOR INSERT
        WITH CHECK (status = 'pending');

CREATE POLICY "update_policy" ON public.tags
    FOR UPDATE
        USING (EXISTS (
            SELECT
                1
            FROM
                send_account_tags sat
                JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                sat.tag_id = tags.id AND sa.user_id = auth.uid()))
            WITH CHECK (EXISTS (
                SELECT
                    1
                FROM
                    send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                WHERE
                    sat.tag_id = tags.id AND sa.user_id = auth.uid()));

CREATE POLICY "delete_policy" ON public.tags
    FOR DELETE
        USING (status = 'pending'
            AND EXISTS (
                SELECT
                    1
                FROM
                    send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                WHERE
                    sat.tag_id = tags.id AND sa.user_id = auth.uid()));

-- Create policies for send_account_tags table
CREATE POLICY "select_policy" ON public.send_account_tags
    FOR SELECT
        USING (EXISTS (
            SELECT
                1
            FROM
                send_accounts sa
            WHERE
                sa.id = send_account_id AND sa.user_id = auth.uid()));

-- Create policy for tag_receipts
CREATE POLICY "select_policy" ON public.tag_receipts
    FOR SELECT
        USING (EXISTS (
            SELECT
                1
            FROM
                send_account_tags sat
                JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                sat.tag_id = tag_receipts.tag_id AND sa.user_id = auth.uid()));

-- Create helper functions first
CREATE OR REPLACE FUNCTION public.create_tag(tag_name citext, send_account_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    BEGIN
        -- Verify user owns the send_account
        IF NOT EXISTS(
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
    IF(
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
    -- Insert tag and create association in one transaction
    WITH new_tag AS(
INSERT INTO tags(name, status)
            VALUES(tag_name, 'pending')
        RETURNING
            id)
        INSERT INTO send_account_tags(send_account_id, tag_id)
        SELECT
            send_account_id,
            id
        FROM
            new_tag;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '%', SQLERRM;
    END;
END;

$$;

-- Modify existing function to also handle main_tag_id
CREATE OR REPLACE FUNCTION public.handle_send_account_tags_deleted()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Update tag status and clear user_id if no other send_account_tags exist
    UPDATE
        tags t
    SET
        status = 'available',
        user_id = NULL
    WHERE
        t.id = OLD.tag_id
        AND NOT EXISTS(
            SELECT
                1
            FROM
                send_account_tags sat
            WHERE
                sat.tag_id = t.id);
    -- Try to update to next oldest confirmed tag if this was the main tag
    UPDATE
        send_accounts sa
    SET
        main_tag_id =(
            SELECT
                t.id
            FROM
                send_account_tags sat
                JOIN tags t ON t.id = sat.tag_id
            WHERE
                sat.send_account_id = OLD.send_account_id
                AND t.status = 'confirmed'
                AND t.id != OLD.tag_id -- Don't select the tag being deleted
            ORDER BY
                sat.created_at ASC
            LIMIT 1)
WHERE
    sa.id = OLD.send_account_id
        AND sa.main_tag_id = OLD.tag_id;
    -- If no other confirmed tags exist, the ON DELETE SET NULL will handle it
    RETURN OLD;
END;
$$;

-- Add new function/trigger for setting initial main_tag_id
CREATE OR REPLACE FUNCTION public.handle_tag_confirmation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- If this is the first confirmed tag for the send account, set it as main
    UPDATE
        send_accounts sa
    SET
        main_tag_id = NEW.id
    FROM
        send_account_tags sat
    WHERE
        sat.tag_id = NEW.id
        AND sat.send_account_id = sa.id
        AND sa.main_tag_id IS NULL;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_main_tag_on_confirmation
    AFTER UPDATE ON tags
    FOR EACH ROW
    WHEN(NEW.status = 'confirmed'::public.tag_status)
    EXECUTE FUNCTION public.handle_tag_confirmation();

CREATE OR REPLACE FUNCTION public.tags_before_insert_or_update_func()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
DECLARE
    _debug text;
BEGIN
    -- Ensure user is not changing their confirmed tag name
    IF TG_OP = 'UPDATE' AND current_setting('role')::text = 'authenticated' AND NEW.status = 'confirmed'::public.tag_status AND OLD.name <> NEW.name THEN
        RAISE EXCEPTION 'Users cannot change the name of a confirmed tag';
    END IF;
    -- Ensure user is not confirming their own tag
    IF NEW.status = 'confirmed'::public.tag_status AND current_setting('role')::text = 'authenticated' THEN
        RAISE EXCEPTION 'Users cannot confirm their own tags';
    END IF;
    -- For INSERT operations, handle existing tags
    IF TG_OP = 'INSERT' THEN
        -- Check for recent pending tags by other users first
        IF EXISTS (
            SELECT
                1
            FROM
                tags t
                JOIN send_account_tags sat ON sat.tag_id = t.id
                JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                t.name = NEW.name
                AND t.status = 'pending'::public.tag_status
                AND (NOW() - t.created_at) < INTERVAL '30 minutes'
                AND sa.user_id != auth.uid()) THEN
        RAISE EXCEPTION 'Tag with same name already exists';
    END IF;
    -- Delete send_account_tags for expired pending tags
    DELETE FROM send_account_tags sat USING tags t, send_accounts sa
    WHERE sat.tag_id = t.id
        AND sat.send_account_id = sa.id
        AND t.name = NEW.name
        AND t.status = 'pending'::public.tag_status
        AND (NOW() - t.created_at) > INTERVAL '30 minutes'
        AND sa.user_id != auth.uid();
    -- If there's an available tag, update it instead of inserting
    UPDATE
        tags
    SET
        status = 'available',
        updated_at = now()
    WHERE
        name = NEW.name
        AND status != 'confirmed';
    -- If we found and updated a tag, skip the INSERT
    IF FOUND THEN
        RETURN NULL;
    END IF;
END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.tags_after_insert_or_update_func()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
BEGIN
    -- Ensure that a user does not exceed the tag limit
    IF TG_OP = 'INSERT' AND(
        SELECT
            COUNT(DISTINCT t.id)
        FROM
            public.tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE
            sa.user_id = auth.uid()) > 5 THEN
        RAISE EXCEPTION 'User can have at most 5 tags';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_verification_tag_registration()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    curr_distribution_id bigint;
    _user_id uuid;
BEGIN
    -- check if tag is confirmed
    IF NEW.status <> 'confirmed'::public.tag_status THEN
        RETURN NEW;
    END IF;
    -- Get user_id from send_account_tags
    SELECT
        sa.user_id INTO _user_id
    FROM
        send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE
        sat.tag_id = NEW.id
    LIMIT 1;
    -- Get the current active distribution
    SELECT
        id INTO curr_distribution_id
    FROM
        distributions
    WHERE
        qualification_start <= now()
        AND qualification_end >= now()
    ORDER BY
        qualification_start DESC
    LIMIT 1;
    -- Only proceed if there's an active distribution and we found a user_id
    IF curr_distribution_id IS NOT NULL AND _user_id IS NOT NULL THEN
        -- Insert verification for the send account's user
        INSERT INTO public.distribution_verifications(distribution_id, user_id, type, metadata)
            VALUES (curr_distribution_id, _user_id, 'tag_registration'::public.verification_type, jsonb_build_object('tag', NEW.name));
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER insert_verification_tag_registration
    AFTER UPDATE ON public.tags
    FOR EACH ROW
    WHEN(NEW.status = 'confirmed'::public.tag_status)
    EXECUTE FUNCTION public.insert_verification_tag_registration();

CREATE OR REPLACE FUNCTION public.tag_receipts_insert_activity_trigger()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'tag_receipt_usdc'
        AND event_id IN(
            SELECT
                event_id
            FROM
                NEW_TABLE);
    -- Insert activity records using send_account_id from the confirmation
    INSERT INTO activity(event_name, event_id, from_user_id, data)
    SELECT
        'tag_receipt_usdc',
        NEW_TABLE.event_id,
        r.user_id,
        jsonb_build_object('log_addr', scr.log_addr, 'block_num', scr.block_num, 'tx_idx', scr.tx_idx, 'log_idx', scr.log_idx, 'tx_hash', scr.tx_hash, 'tags', array_agg(NEW_TABLE.tag_name), 'value', scr.amount::text)
    FROM
        NEW_TABLE
        JOIN receipts r ON r.event_id = NEW_TABLE.event_id
        JOIN sendtag_checkout_receipts scr ON scr.event_id = NEW_TABLE.event_id
    GROUP BY
        r.user_id,
        NEW_TABLE.event_id,
        scr.event_id,
        scr.log_addr,
        scr.block_num,
        scr.tx_idx,
        scr.log_idx,
        scr.tx_hash,
        scr.amount;
    RETURN NULL;
END;
$function$;

-- Create or replace the triggers
CREATE OR REPLACE TRIGGER trigger_tags_before_insert_or_update
    BEFORE INSERT OR UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION public.tags_before_insert_or_update_func();

CREATE OR REPLACE TRIGGER trigger_tags_after_insert_or_update
    AFTER INSERT OR UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION public.tags_after_insert_or_update_func();

-- Create just one trigger
CREATE TRIGGER send_account_tags_deleted
    AFTER DELETE ON send_account_tags
    FOR EACH ROW
    EXECUTE FUNCTION handle_send_account_tags_deleted();

-- Add delete policy for send_account_tags
CREATE POLICY "delete_policy" ON send_account_tags
    FOR DELETE
        USING (EXISTS (
            SELECT
                1
            FROM
                send_accounts sa
            WHERE
                sa.id = send_account_id AND sa.user_id = auth.uid()));

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_tag(citext, uuid) TO authenticated;

-- Add confirm_tags function
CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
            -- Insert only one referral for the user with tag_id
            INSERT INTO referrals(referrer_id, referred_id, tag, tag_id)
            SELECT
                referrer_id,
                _user_id,
                t.name,
                t.id
            FROM
                tags t
            WHERE
                t.name = tag_names[1]
                AND t.status = 'confirmed'
            LIMIT 1;
        END IF;
    END IF;
END IF;
END;
$$;

-- Update confirm_tags permissions
REVOKE EXECUTE ON FUNCTION confirm_tags(citext[], uuid, text, text) FROM public;

REVOKE EXECUTE ON FUNCTION confirm_tags(citext[], uuid, text, text) FROM anon;

REVOKE EXECUTE ON FUNCTION confirm_tags(citext[], uuid, text, text) FROM authenticated;

GRANT EXECUTE ON FUNCTION confirm_tags(citext[], uuid, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.check_tags_allowlist_before_insert_func()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    tag_allowlist RECORD;
BEGIN
    -- check if tag name is in the allowlist and the verified chain address matches
    SELECT
        *
    FROM
        tag_reservations
    WHERE
        tag_name = NEW.name INTO tag_allowlist;
    IF FOUND THEN
        IF (
            SELECT
                address
            FROM
                chain_addresses
            WHERE
                user_id = auth.uid() -- Use auth.uid() instead of NEW.user_id
                AND tag_allowlist.chain_address = address) IS NULL THEN
            RAISE EXCEPTION 'You don''t got the riz for the tag: %', NEW.name;
        END IF;
    END IF;
    -- Return the new record to be inserted or updated
    RETURN NEW;
END;
$$;

