-- Table: historical_tag_associations
-- Stores historical tag ownership data for auditing purposes
CREATE TABLE IF NOT EXISTS "public"."historical_tag_associations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "tag_name" citext NOT NULL,
    "tag_id" bigint NOT NULL,
    "user_id" uuid NOT NULL,
    "status" tag_status NOT NULL,
    "captured_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "historical_tag_associations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."historical_tag_associations" OWNER TO "postgres";

-- Indexes
CREATE INDEX "idx_historical_tag_associations_user_id" ON "public"."historical_tag_associations" USING "btree" ("user_id");
CREATE INDEX "idx_historical_tag_associations_tag_id" ON "public"."historical_tag_associations" USING "btree" ("tag_id");
CREATE INDEX "idx_historical_tag_associations_tag_name" ON "public"."historical_tag_associations" USING "btree" ("tag_name");

-- Foreign Keys
ALTER TABLE ONLY "public"."historical_tag_associations"
    ADD CONSTRAINT "historical_tag_associations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

-- RLS
ALTER TABLE "public"."historical_tag_associations" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_policy" ON "public"."historical_tag_associations"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON TABLE "public"."historical_tag_associations" TO "anon";
GRANT ALL ON TABLE "public"."historical_tag_associations" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_tag_associations" TO "service_role";

-- View: tag_history
CREATE OR REPLACE VIEW "public"."tag_history" AS
SELECT
    t.id AS tag_id,
    t.name,
    t.status,
    sat.created_at,
    p.send_id
FROM
    tags t
    JOIN send_account_tags sat ON sat.tag_id = t.id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    JOIN profiles p ON p.id = sa.user_id;

ALTER TABLE "public"."tag_history" OWNER TO "postgres";

-- Grants for view
GRANT ALL ON TABLE "public"."tag_history" TO "anon";
GRANT ALL ON TABLE "public"."tag_history" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_history" TO "service_role";