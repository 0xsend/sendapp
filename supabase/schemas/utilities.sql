-- Standalone utility functions that don't belong to a specific table
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

-- Grants




REVOKE ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";


