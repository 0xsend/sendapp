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
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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

-- Indexes
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at");
CREATE INDEX "notifications_user_id_read_idx" ON "public"."notifications" USING "btree" ("user_id", "read");

CREATE INDEX "push_tokens_user_id_idx" ON "public"."push_tokens" USING "btree" ("user_id");
CREATE UNIQUE INDEX "push_tokens_user_platform_token_idx" ON "public"."push_tokens" USING "btree" ("user_id", "platform", "token") WHERE ("token" IS NOT NULL);
CREATE UNIQUE INDEX "push_tokens_user_platform_endpoint_idx" ON "public"."push_tokens" USING "btree" ("user_id", "platform", "endpoint") WHERE ("endpoint" IS NOT NULL);

-- Foreign Keys
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can insert their own notifications" ON "public"."notifications" FOR INSERT WITH CHECK (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (((SELECT auth.uid()) = "user_id"));

CREATE POLICY "Users can view their own push tokens" ON "public"."push_tokens" FOR SELECT USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can insert their own push tokens" ON "public"."push_tokens" FOR INSERT WITH CHECK (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can update their own push tokens" ON "public"."push_tokens" FOR UPDATE USING (((SELECT auth.uid()) = "user_id"));
CREATE POLICY "Users can delete their own push tokens" ON "public"."push_tokens" FOR DELETE USING (((SELECT auth.uid()) = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON TABLE "public"."push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";

GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "service_role";

-- Functions
CREATE OR REPLACE FUNCTION "public"."update_push_token_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_push_token_updated_at"() OWNER TO "postgres";

-- Triggers
CREATE TRIGGER "update_push_tokens_updated_at"
    BEFORE UPDATE ON "public"."push_tokens"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_push_token_updated_at"();
