-- Types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'transfer_sent',
        'transfer_received',
        'tag_confirmed',
        'account_activity',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE push_token_platform AS ENUM (
        'expo',
        'web'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."notifications_id_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."push_tokens_id_seq"
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."push_tokens_id_seq" OWNER TO "postgres";

-- Tables
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" notification_type NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "data" "jsonb",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone
);
ALTER TABLE "public"."notifications" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "platform" push_token_platform NOT NULL,
    "token" "text",
    "endpoint" "text",
    "p256dh" "text",
    "auth" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "device_id" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "last_used_at" timestamp with time zone
);
ALTER TABLE "public"."push_tokens" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";
ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");

ALTER SEQUENCE "public"."push_tokens_id_seq" OWNED BY "public"."push_tokens"."id";
ALTER TABLE ONLY "public"."push_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."push_tokens_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");

-- Data integrity: ensure platform-specific fields are present/absent
ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_platform_fields_check"
    CHECK (
        (
            platform = 'expo'::push_token_platform
            AND token IS NOT NULL
            AND endpoint IS NULL
            AND p256dh IS NULL
            AND auth IS NULL
        )
        OR
        (
            platform = 'web'::push_token_platform
            AND token IS NULL
            AND endpoint IS NOT NULL
            AND p256dh IS NOT NULL
            AND auth IS NOT NULL
        )
    ) NOT VALID;

-- Indexes
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at");
CREATE INDEX "notifications_user_id_read_idx" ON "public"."notifications" USING "btree" ("user_id", "read");
-- Partial indexes for delivered/read timestamps (only index non-NULL values)
CREATE INDEX "notifications_delivered_at_idx" ON "public"."notifications" USING "btree" ("user_id", "delivered_at") WHERE "delivered_at" IS NOT NULL;
CREATE INDEX "notifications_read_at_idx" ON "public"."notifications" USING "btree" ("user_id", "read_at") WHERE "read_at" IS NOT NULL;

CREATE INDEX "push_tokens_user_id_idx" ON "public"."push_tokens" USING "btree" ("user_id");
CREATE UNIQUE INDEX "push_tokens_user_platform_token_idx" ON "public"."push_tokens" USING "btree" ("user_id", "platform", "token") WHERE ("token" IS NOT NULL);
CREATE UNIQUE INDEX "push_tokens_user_platform_endpoint_idx" ON "public"."push_tokens" USING "btree" ("user_id", "platform", "endpoint") WHERE ("endpoint" IS NOT NULL);
-- Non-partial unique constraint for web push upsert (endpoint is always set for web platform)
CREATE UNIQUE INDEX "push_tokens_web_endpoint_unique_idx" ON "public"."push_tokens" USING "btree" ("user_id", "endpoint") WHERE ("platform" = 'web');

-- Efficient querying of active tokens
CREATE INDEX "push_tokens_is_active_idx" ON "public"."push_tokens" USING btree ("is_active") WHERE "is_active" = true;

-- Foreign Keys
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can insert their own notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));

CREATE POLICY "Users can view their own push tokens" ON "public"."push_tokens" FOR SELECT TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can insert their own push tokens" ON "public"."push_tokens" FOR INSERT TO "authenticated" WITH CHECK (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can update their own push tokens" ON "public"."push_tokens" FOR UPDATE TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can delete their own push tokens" ON "public"."push_tokens" FOR DELETE TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));

-- Grants
-- SECURITY: anon role has NO access to these tables
-- authenticated: minimal CRUD (RLS enforces row-level access)
-- service_role: full access for backend operations

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."push_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "service_role";

-- Functions
CREATE OR REPLACE FUNCTION "public"."update_push_token_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
    AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_push_token_updated_at"() OWNER TO "postgres";

-- SECURITY: Trigger functions should not be directly callable
REVOKE ALL ON FUNCTION "public"."update_push_token_updated_at"() FROM PUBLIC;

-- Register or refresh an Expo push token
-- SECURITY: derives user identity from auth.uid() (no user_id parameter)
-- NOTE: web subscriptions must use upsert_web_push_token
CREATE OR REPLACE FUNCTION "public"."register_push_token"(
    token_value text,
    token_platform push_token_platform,
    token_device_id text DEFAULT NULL
)
RETURNS SETOF push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_result push_tokens%ROWTYPE;
BEGIN
    IF token_platform = 'web'::push_token_platform THEN
        RAISE EXCEPTION 'Use upsert_web_push_token for web push subscriptions';
    END IF;

    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register push token';
    END IF;

    INSERT INTO push_tokens (
        user_id,
        platform,
        token,
        device_id,
        is_active,
        last_used_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        token_platform,
        token_value,
        token_device_id,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, platform, token) WHERE token IS NOT NULL
    DO UPDATE SET
        device_id = COALESCE(EXCLUDED.device_id, push_tokens.device_id),
        is_active = true,
        last_used_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN NEXT v_result;
END;
$$;

ALTER FUNCTION "public"."register_push_token"(text, push_token_platform, text) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO "service_role";

-- Upsert function for web push tokens (atomic insert or update)
-- SECURITY: User identity is derived from auth.uid(), NOT from a parameter
-- This prevents cross-user token registration attacks
CREATE OR REPLACE FUNCTION public.upsert_web_push_token(p_endpoint text, p_p256dh text, p_auth text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    -- Derive user identity from auth context - prevents cross-user writes
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register web push token';
    END IF;

    INSERT INTO public.push_tokens (user_id, platform, token, endpoint, p256dh, auth, is_active, last_used_at)
    VALUES (v_user_id, 'web', NULL, p_endpoint, p_p256dh, p_auth, true, NOW())
    ON CONFLICT (user_id, endpoint) WHERE platform = 'web'
    DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        is_active = true,
        last_used_at = NOW(),
        updated_at = clock_timestamp();
END;
$function$
;

ALTER FUNCTION "public"."upsert_web_push_token"("text", "text", "text") OWNER TO "postgres";

-- SECURITY: Only authenticated users can call this function
REVOKE ALL ON FUNCTION "public"."upsert_web_push_token"("text", "text", "text") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."upsert_web_push_token"("text", "text", "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."upsert_web_push_token"("text", "text", "text") TO "service_role";

-- Cleanup stale push tokens
-- Deletes inactive tokens older than 90 days
-- Marks active tokens unused for over 60 days as inactive
CREATE OR REPLACE FUNCTION "public"."cleanup_stale_push_tokens"()
RETURNS TABLE(deleted_count bigint, deactivated_count bigint)
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_deleted bigint;
    v_deactivated bigint;
BEGIN
    -- Delete inactive tokens older than 90 days
    DELETE FROM push_tokens
    WHERE is_active = false
      AND updated_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    -- Mark active tokens unused for over 60 days as inactive
    UPDATE push_tokens
    SET is_active = false
    WHERE is_active = true
      AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '60 days');
    GET DIAGNOSTICS v_deactivated = ROW_COUNT;

    RETURN QUERY SELECT v_deleted, v_deactivated;
END;
$$;

ALTER FUNCTION "public"."cleanup_stale_push_tokens"() OWNER TO "postgres";

-- SECURITY: Only service_role can run cleanup (maintenance task)
REVOKE ALL ON FUNCTION "public"."cleanup_stale_push_tokens"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."cleanup_stale_push_tokens"() TO "service_role";

-- Triggers
CREATE TRIGGER "update_push_tokens_updated_at"
    BEFORE UPDATE ON "public"."push_tokens"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_push_token_updated_at"();
