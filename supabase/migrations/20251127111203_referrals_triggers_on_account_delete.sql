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

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_referral_verifications_on_user_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_dist_id integer;
BEGIN
    -- Get current distribution (active qualification period)
    SELECT id INTO current_dist_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only proceed if there's an active distribution
    IF current_dist_id IS NOT NULL THEN
        -- Set weight to 0 for tag_referral verifications in current distribution
        -- where the deleted user was the referred user
        UPDATE distribution_verifications dv
        SET weight = 0
        WHERE dv.distribution_id = current_dist_id
          AND dv.type = 'tag_referral'
          AND (dv.metadata->>'referred_id')::uuid = OLD.id;

        -- Recalculate total_tag_referrals for affected referrers
        -- in current distribution
        -- Match update_referral_verifications logic: only count referrals
        -- who have distribution_shares in CURRENT distribution
        WITH affected_referrers AS (
            SELECT DISTINCT r.referrer_id
            FROM referrals r
            WHERE r.referred_id = OLD.id
        ),
        referral_counts AS (
            SELECT
                r.referrer_id,
                COUNT(*) FILTER (
                    WHERE r.referred_id != OLD.id
                    AND EXISTS (
                        SELECT 1
                        FROM distribution_shares ds
                        WHERE ds.user_id = r.referred_id
                        AND ds.distribution_id = current_dist_id
                        AND ds.amount > 0
                    )
                ) as new_count
            FROM referrals r
            WHERE r.referrer_id IN (SELECT referrer_id FROM affected_referrers)
            GROUP BY r.referrer_id
        )
        UPDATE distribution_verifications dv
        SET weight = COALESCE(rc.new_count, 0)
        FROM referral_counts rc
        WHERE dv.distribution_id = current_dist_id
          AND dv.type = 'total_tag_referrals'
          AND dv.user_id = rc.referrer_id;
    END IF;

    RETURN OLD;
END;
$function$
;

ALTER FUNCTION "public"."cleanup_referral_verifications_on_user_delete"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "private"."decrement_leaderboard_referrals_on_delete"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."cleanup_referral_verifications_on_user_delete"() FROM PUBLIC;

CREATE TRIGGER cleanup_referral_verifications_before_profile_delete BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION cleanup_referral_verifications_on_user_delete();

CREATE TRIGGER decrement_leaderboard_referrals AFTER DELETE ON public.referrals FOR EACH ROW EXECUTE FUNCTION private.decrement_leaderboard_referrals_on_delete();
