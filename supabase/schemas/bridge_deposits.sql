-- Bridge deposits table: tracks deposit events and status from ACH/Wire transfers
-- Updated via webhooks as deposits progress through the Bridge pipeline

CREATE TABLE IF NOT EXISTS "public"."bridge_deposits" (
    "id" "uuid" PRIMARY KEY DEFAULT gen_random_uuid(),
    "virtual_account_id" "uuid" NOT NULL,
    "bridge_transfer_id" "text" UNIQUE NOT NULL,
    "last_event_id" "text",
    "last_event_type" "text",
    "payment_rail" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" NOT NULL DEFAULT 'usd',
    "status" "text" NOT NULL DEFAULT 'funds_received',
    "sender_name" "text",
    "sender_routing_number" "text",
    "trace_number" "text",
    "destination_tx_hash" "text",
    "fee_amount" numeric,
    "net_amount" numeric,
    "event_data" "jsonb",
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "bridge_deposits_status_check" CHECK (
        "status" IN ('funds_received', 'in_review', 'payment_submitted', 'payment_processed', 'refund')
    ),
    CONSTRAINT "bridge_deposits_payment_rail_check" CHECK (
        "payment_rail" IN ('ach_push', 'wire')
    )
);

ALTER TABLE "public"."bridge_deposits" OWNER TO "postgres";

-- Indexes
CREATE INDEX IF NOT EXISTS "bridge_deposits_virtual_account_id_idx" ON "public"."bridge_deposits" ("virtual_account_id");
CREATE INDEX IF NOT EXISTS "bridge_deposits_status_idx" ON "public"."bridge_deposits" ("status");
CREATE INDEX IF NOT EXISTS "bridge_deposits_created_at_idx" ON "public"."bridge_deposits" ("created_at" DESC);

-- Foreign Keys
ALTER TABLE ONLY "public"."bridge_deposits"
    ADD CONSTRAINT "bridge_deposits_virtual_account_id_fkey" FOREIGN KEY ("virtual_account_id") REFERENCES "public"."bridge_virtual_accounts"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."bridge_deposits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposits"
    ON "public"."bridge_deposits" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."bridge_virtual_accounts" bva
            JOIN "public"."bridge_customers" bc ON bc."id" = bva."bridge_customer_id"
            WHERE bva."id" = "bridge_deposits"."virtual_account_id"
            AND bc."user_id" = (SELECT auth.uid())
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER "bridge_deposits_updated_at"
    BEFORE UPDATE ON "public"."bridge_deposits"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Grants
GRANT ALL ON TABLE "public"."bridge_deposits" TO "anon";
GRANT ALL ON TABLE "public"."bridge_deposits" TO "authenticated";
GRANT ALL ON TABLE "public"."bridge_deposits" TO "service_role";
