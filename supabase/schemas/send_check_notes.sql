-- Table for storing optional notes attached to send checks
-- Notes are stored offchain and associated with checks via ephemeral_address + chain_id
CREATE TABLE IF NOT EXISTS "public"."send_check_notes" (
    "ephemeral_address" bytea NOT NULL,
    "chain_id" numeric NOT NULL,
    "note" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("ephemeral_address", "chain_id")
);

ALTER TABLE "public"."send_check_notes" OWNER TO "postgres";

-- Indexes
CREATE INDEX "idx_send_check_notes_created_at" ON "public"."send_check_notes" USING "btree" ("created_at");

-- RLS
ALTER TABLE "public"."send_check_notes" ENABLE ROW LEVEL SECURITY;

-- Anyone can read notes (needed for claim flow where recipient views the note)
CREATE POLICY "anyone can read send check notes" ON "public"."send_check_notes"
    FOR SELECT TO anon, authenticated USING (true);

-- Only the check sender can insert notes
-- We verify ownership by checking that the sender address matches the user's send account
CREATE POLICY "sender can insert send check notes" ON "public"."send_check_notes"
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM send_check_created c
            JOIN send_accounts sa ON sa.address = ('0x' || encode(c.sender, 'hex'))::citext
            WHERE c.ephemeral_address = send_check_notes.ephemeral_address
            AND c.chain_id = send_check_notes.chain_id
            AND sa.user_id = auth.uid()
        )
    );

-- Grants
GRANT ALL ON TABLE "public"."send_check_notes" TO "anon";
GRANT ALL ON TABLE "public"."send_check_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."send_check_notes" TO "service_role";
