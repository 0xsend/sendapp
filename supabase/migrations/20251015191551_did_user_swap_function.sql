CREATE OR REPLACE FUNCTION public.did_user_swap()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN EXISTS (
    SELECT 1
    FROM activity_feed af
    WHERE (
              EXISTS (
                  SELECT 1 FROM liquidity_pools lp
                  WHERE (af.data->>'f')::bytea = lp.pool_addr
              )
                  OR EXISTS (
                  SELECT 1 FROM swap_routers sr
                  WHERE (af.data->>'f')::bytea = sr.router_addr
              )
                  OR EXISTS (
                  SELECT 1 FROM liquidity_pools lp
                  WHERE (af.data->>'t')::bytea = lp.pool_addr
              )
                  OR EXISTS (
                  SELECT 1 FROM swap_routers sr
                  WHERE (af.data->>'t')::bytea = sr.router_addr
              )
              )
    LIMIT 1
);
END;
$function$
;

ALTER FUNCTION "public"."did_user_swap"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."did_user_swap"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."did_user_swap"() TO "anon";
GRANT ALL ON FUNCTION "public"."did_user_swap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."did_user_swap"() TO "service_role";