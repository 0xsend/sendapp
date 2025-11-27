set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.decrement_leaderboard_referrals_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Decrement the referral count for the referrer
    -- Use GREATEST to ensure we never go below 0
    UPDATE private.leaderboard_referrals_all_time
    SET referrals = GREATEST(0, referrals - 1),
        updated_at = now()
    WHERE user_id = OLD.referrer_id;

    RETURN OLD;
END;
$function$
;

ALTER FUNCTION "private"."decrement_leaderboard_referrals_on_delete"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "private"."decrement_leaderboard_referrals_on_delete"() FROM PUBLIC;

CREATE TRIGGER decrement_leaderboard_referrals AFTER DELETE ON public.referrals FOR EACH ROW EXECUTE FUNCTION private.decrement_leaderboard_referrals_on_delete();


