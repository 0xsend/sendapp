CREATE OR REPLACE FUNCTION public.send_accounts_after_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$ BEGIN -- Ensure that a user does not exceed the send_accounts limit
    IF (
        TG_OP = 'INSERT'
        OR TG_OP = 'UPDATE'
    )
    AND (
        SELECT COUNT(*)
        FROM public.send_accounts
        WHERE user_id = NEW.user_id
    ) > 1 THEN RAISE EXCEPTION 'User can have at most 1 send account';

END IF;

-- Return the new record to be inserted or updated
RETURN NEW;

END;

$function$;

CREATE TRIGGER trigger_send_accounts_after_insert
AFTER
INSERT
    OR
UPDATE ON public.send_accounts FOR EACH ROW EXECUTE FUNCTION send_accounts_after_insert();
