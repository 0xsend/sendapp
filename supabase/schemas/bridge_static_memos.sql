-- Bridge static memos table: stores static memo metadata and deposit instructions
-- Created after KYC approval; deposit instructions are stored as JSONB

CREATE TABLE IF NOT EXISTS "public"."bridge_static_memos" (
    "id" "uuid" PRIMARY KEY DEFAULT gen_random_uuid(),
    "bridge_customer_id" "uuid" NOT NULL,
    "bridge_static_memo_id" "text" UNIQUE NOT NULL,
    "source_currency" "text" NOT NULL DEFAULT 'usd',
    "destination_currency" "text" NOT NULL DEFAULT 'usdc',
    "destination_payment_rail" "text" NOT NULL DEFAULT 'base',
    "destination_address" "text" NOT NULL,
    "source_deposit_instructions" "jsonb",
    "status" "text" NOT NULL DEFAULT 'active',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "bridge_static_memos_status_check" CHECK (
        "status" IN ('active', 'inactive', 'closed')
    )
);

ALTER TABLE "public"."bridge_static_memos" OWNER TO "postgres";

-- Indexes
CREATE INDEX IF NOT EXISTS "bridge_static_memos_bridge_customer_id_idx" ON "public"."bridge_static_memos" ("bridge_customer_id");
CREATE INDEX IF NOT EXISTS "bridge_static_memos_bridge_static_memo_id_idx" ON "public"."bridge_static_memos" ("bridge_static_memo_id");
CREATE UNIQUE INDEX IF NOT EXISTS "bridge_static_memos_active_unique"
    ON "public"."bridge_static_memos" ("bridge_customer_id")
    WHERE "status" = 'active';

-- Foreign Keys
ALTER TABLE ONLY "public"."bridge_static_memos"
    ADD CONSTRAINT "bridge_static_memos_bridge_customer_id_fkey" FOREIGN KEY ("bridge_customer_id") REFERENCES "public"."bridge_customers"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."bridge_static_memos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own static memos"
    ON "public"."bridge_static_memos" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."bridge_customers" bc
            WHERE bc."id" = "bridge_static_memos"."bridge_customer_id"
            AND bc."user_id" = (SELECT auth.uid())
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER "bridge_static_memos_updated_at"
    BEFORE UPDATE ON "public"."bridge_static_memos"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Grants
GRANT ALL ON TABLE "public"."bridge_static_memos" TO "authenticated";
GRANT ALL ON TABLE "public"."bridge_static_memos" TO "service_role";
