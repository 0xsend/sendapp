-- Bridge customers table: stores Bridge XYZ customer data linked to Send users
-- Used for KYC verification and deposit account setup

CREATE TABLE IF NOT EXISTS "public"."bridge_customers" (
    "id" "uuid" PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" "uuid" NOT NULL,
    "bridge_customer_id" "text" UNIQUE,
    "kyc_link_id" "text" UNIQUE NOT NULL,
    "kyc_status" "text" NOT NULL DEFAULT 'not_started',
    "tos_status" "text" NOT NULL DEFAULT 'pending',
    "full_name" "text",
    "email" "text" NOT NULL,
    "type" "text" NOT NULL DEFAULT 'individual',
    "rejection_reasons" "jsonb",
    "rejection_attempts" integer NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "bridge_customers_user_id_type_unique" UNIQUE ("user_id", "type"),
    CONSTRAINT "bridge_customers_kyc_status_check" CHECK (
        "kyc_status" IN ('not_started', 'incomplete', 'under_review', 'approved', 'rejected', 'paused', 'offboarded', 'awaiting_questionnaire', 'awaiting_ubo')
    ),
    CONSTRAINT "bridge_customers_tos_status_check" CHECK (
        "tos_status" IN ('pending', 'approved')
    ),
    CONSTRAINT "bridge_customers_type_check" CHECK (
        "type" IN ('individual', 'business')
    )
);

ALTER TABLE "public"."bridge_customers" OWNER TO "postgres";

-- Indexes
CREATE INDEX IF NOT EXISTS "bridge_customers_user_id_idx" ON "public"."bridge_customers" ("user_id");
CREATE INDEX IF NOT EXISTS "bridge_customers_bridge_customer_id_idx" ON "public"."bridge_customers" ("bridge_customer_id");
CREATE INDEX IF NOT EXISTS "bridge_customers_kyc_link_id_idx" ON "public"."bridge_customers" ("kyc_link_id");
CREATE INDEX IF NOT EXISTS "bridge_customers_kyc_status_idx" ON "public"."bridge_customers" ("kyc_status");

-- Foreign Keys
ALTER TABLE ONLY "public"."bridge_customers"
    ADD CONSTRAINT "bridge_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."bridge_customers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bridge customer"
    ON "public"."bridge_customers" FOR SELECT
    USING ((SELECT auth.uid()) = "user_id");

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER "bridge_customers_updated_at"
    BEFORE UPDATE ON "public"."bridge_customers"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Grants
GRANT ALL ON TABLE "public"."bridge_customers" TO "service_role";
