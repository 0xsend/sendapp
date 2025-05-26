-- Standalone utility functions that don't belong to a specific table

CREATE OR REPLACE FUNCTION "public"."get_friends"() RETURNS TABLE("avatar_url" "text", "x_username" "text", "birthday" "date", "tag" "public"."citext", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
                        AND t.status = 'confirmed'
            WHERE
                r.referrer_id = auth.uid())
        SELECT
            o.avatar_url,
            o.x_username,
            o.birthday,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$$;
ALTER FUNCTION "public"."get_friends"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_pending_jackpot_tickets_purchased"() RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    pending_tickets_sum numeric;
BEGIN
    WITH recent_run AS (
        -- Get the most recent jackpot run
        SELECT block_num
        FROM public.sendpot_jackpot_runs
        ORDER BY block_num DESC
        LIMIT 1
    )
    SELECT COALESCE(SUM(tickets_purchased_total_bps), 0)
    INTO pending_tickets_sum
    FROM public.sendpot_user_ticket_purchases
    WHERE block_num > COALESCE((SELECT block_num FROM recent_run), 0);
    
    RETURN pending_tickets_sum;
END;
$$;
ALTER FUNCTION "public"."get_pending_jackpot_tickets_purchased"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_recent_senders"() RETURNS TABLE("account_id" bigint, "name" "text", "avatar_url" "text", "address" "public"."citext", "send_id" bigint, "tag" "public"."citext")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_profile profiles;
BEGIN
  -- Get the current user's profile
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  
  RETURN QUERY
  WITH recent_transfers AS (
    SELECT DISTINCT f, block_time
    FROM send_account_transfers
    WHERE t = decode(substring(user_profile.address, 3), 'hex')
      AND f != decode(substring(user_profile.address, 3), 'hex')
    ORDER BY block_time DESC
    LIMIT 100
  ),
  sender_profiles AS (
    SELECT DISTINCT ON (sa.address)
      sa.id AS account_id,
      p.name,
      p.avatar_url,
      sa.address,
      p.send_id,
      t.name AS tag
    FROM recent_transfers rt
    JOIN send_accounts sa ON sa.address = concat('0x', encode(rt.f, 'hex'))::citext
    JOIN profiles p ON p.id = sa.user_id
    LEFT JOIN tags t ON t.user_id = p.id AND t.status = 'confirmed'
    WHERE sa.user_id != auth.uid()
    ORDER BY sa.address, rt.block_time DESC
  )
  SELECT sp.*
  FROM sender_profiles sp
  LIMIT 50;
END;
$$;
ALTER FUNCTION "public"."get_recent_senders"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."referrer_lookup"("referral_code" "text") RETURNS TABLE("ref_result" "uuid", "new_ref_result" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
ref_result uuid;
new_ref_result uuid;
BEGIN
SELECT (
           SELECT u.id
           FROM auth.users u
                    JOIN public.profiles p ON u.id = p.id
           WHERE p.refcode = referral_code
       ) INTO ref_result;

SELECT (
           SELECT u.id
           FROM auth.users u
                    JOIN public.profiles p ON u.id = p.id
           WHERE p.refcode = (SELECT replace(referral_code::text,'/','-'))
       ) INTO new_ref_result;

RETURN QUERY
SELECT ref_result, new_ref_result;
END;
$$;
ALTER FUNCTION "public"."referrer_lookup"("referral_code" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."stop_change_send_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN

  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."stop_change_send_id"() OWNER TO "postgres";

-- Grants
REVOKE ALL ON FUNCTION "public"."get_friends"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_friends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friends"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_recent_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_recent_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_senders"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."stop_change_send_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "service_role";