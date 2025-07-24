CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN

RETURN substr(md5(random()::text), 0, 12);

END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."generate_referral_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";




CREATE SEQUENCE IF NOT EXISTS "public"."profiles_send_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."profiles_send_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "name" "text",
    "about" "text",
    "referral_code" "text" DEFAULT "public"."generate_referral_code"(),
    "is_public" boolean DEFAULT true,
    "send_id" integer DEFAULT "nextval"('"public"."profiles_send_id_seq"'::"regclass") NOT NULL,
    "x_username" "text",
    "birthday" "date",
    "banner_url" "text",
    CONSTRAINT "profiles_about_update" CHECK (("length"("about") < 255)),
    CONSTRAINT "profiles_name_update" CHECK (("length"("name") < 63)),
    CONSTRAINT "profiles_x_username_update" CHECK (("length"("x_username") <= 64))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");

-- Indexes
CREATE INDEX "profiles_send_id_idx" ON "public"."profiles" USING "btree" ("send_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by users who created them." ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

-- Grants
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "service_role";

-- Functions
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ begin
insert into public.profiles (id)
values (new.id);

return new;

end;

$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

CREATE OR REPLACE FUNCTION public.stop_change_send_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN

  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$
;
ALTER FUNCTION "public"."stop_change_send_id"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."stop_change_send_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "service_role";

-- Triggers
CREATE OR REPLACE TRIGGER "avoid_send_id_change" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."stop_change_send_id"();
