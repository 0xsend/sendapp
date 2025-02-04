SET check_function_bodies = OFF;

CREATE OR REPLACE FUNCTION public.referrals_insert_activity_trigger()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
BEGIN
    -- Just insert the activity, the view will handle the tags
    INSERT INTO activity(event_name, event_id, from_user_id, to_user_id, data, created_at)
    SELECT
        'referrals',
        private.generate_referral_event_id(NEW_TABLE.referrer_id, array_agg(DISTINCT NEW_TABLE.tag)),
        NEW_TABLE.referrer_id,
        NEW_TABLE.referred_id,
        jsonb_build_object('tags', array_agg(DISTINCT NEW_TABLE.tag ORDER BY NEW_TABLE.tag)),
        CURRENT_TIMESTAMP
    FROM
        NEW_TABLE
    GROUP BY
        NEW_TABLE.referrer_id,
        NEW_TABLE.referred_id;
    RETURN NULL;
END;
$function$;

