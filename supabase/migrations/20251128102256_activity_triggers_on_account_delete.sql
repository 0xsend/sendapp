set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.preserve_activity_before_user_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Set from_user_id to NULL only where to_user_id exists and is different
    -- Only for transaction activities (not referrals - they're auto-deleted)
    UPDATE activity
    SET from_user_id = NULL
    WHERE from_user_id = OLD.id
      AND to_user_id IS NOT NULL
      AND to_user_id != OLD.id
      AND event_name IN ('send_account_transfers', 'send_account_receives', 'temporal_send_account_transfers');

    -- Set to_user_id to NULL only where from_user_id exists and is different
    -- Only for transaction activities (not referrals - they're auto-deleted)
    UPDATE activity
    SET to_user_id = NULL
    WHERE to_user_id = OLD.id
      AND from_user_id IS NOT NULL
      AND from_user_id != OLD.id
      AND event_name IN ('send_account_transfers', 'send_account_receives', 'temporal_send_account_transfers');

    RETURN OLD;
END;
$function$
;

ALTER FUNCTION "public"."preserve_activity_before_user_deletion"() OWNER TO "postgres";

-- Trigger that fires BEFORE user deletion to preserve multi-user activities
CREATE TRIGGER preserve_activity_on_user_deletion
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.preserve_activity_before_user_deletion();

REVOKE ALL ON FUNCTION "public"."preserve_activity_before_user_deletion"() FROM PUBLIC;

