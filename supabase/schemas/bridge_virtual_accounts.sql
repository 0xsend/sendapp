-- Bridge virtual accounts table: stores virtual bank account details for deposits
-- Created after KYC approval, provides routing/account numbers for ACH/Wire deposits

CREATE TABLE IF NOT EXISTS "public"."bridge_virtual_accounts" (
    "id" "uuid" PRIMARY KEY DEFAULT gen_random_uuid(),
    "bridge_customer_id" "uuid" NOT NULL,
    "bridge_virtual_account_id" "text" UNIQUE NOT NULL,
    "source_currency" "text" NOT NULL DEFAULT 'usd',
    "destination_currency" "text" NOT NULL DEFAULT 'usdc',
    "destination_payment_rail" "text" NOT NULL DEFAULT 'base',
    "destination_address" "text" NOT NULL,
    "bank_name" "text",
    "bank_routing_number" "text",
    "bank_account_number" "text",
    "bank_beneficiary_name" "text",
    "bank_beneficiary_address" "text",
    "payment_rails" "text"[] NOT NULL DEFAULT '{}'::text[],
    "source_deposit_instructions" "jsonb",
    "status" "text" NOT NULL DEFAULT 'active',
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "bridge_virtual_accounts_status_check" CHECK (
        "status" IN ('active', 'inactive', 'closed')
    )
);

ALTER TABLE "public"."bridge_virtual_accounts" OWNER TO "postgres";

-- Indexes
CREATE INDEX IF NOT EXISTS "bridge_virtual_accounts_bridge_customer_id_idx" ON "public"."bridge_virtual_accounts" ("bridge_customer_id");
CREATE INDEX IF NOT EXISTS "bridge_virtual_accounts_bridge_va_id_idx" ON "public"."bridge_virtual_accounts" ("bridge_virtual_account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "bridge_virtual_accounts_active_unique"
    ON "public"."bridge_virtual_accounts" ("bridge_customer_id")
    WHERE "status" = 'active';

-- Foreign Keys
ALTER TABLE ONLY "public"."bridge_virtual_accounts"
    ADD CONSTRAINT "bridge_virtual_accounts_bridge_customer_id_fkey" FOREIGN KEY ("bridge_customer_id") REFERENCES "public"."bridge_customers"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."bridge_virtual_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own virtual accounts"
    ON "public"."bridge_virtual_accounts" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."bridge_customers" bc
            WHERE bc."id" = "bridge_virtual_accounts"."bridge_customer_id"
            AND bc."user_id" = (SELECT auth.uid())
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER "bridge_virtual_accounts_updated_at"
    BEFORE UPDATE ON "public"."bridge_virtual_accounts"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Grants
GRANT ALL ON TABLE "public"."bridge_virtual_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bridge_virtual_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bridge_virtual_accounts" TO "service_role";
