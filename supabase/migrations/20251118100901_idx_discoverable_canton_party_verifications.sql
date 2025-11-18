CREATE INDEX IF NOT EXISTS "canton_party_verifications_discoverable_user_id_canton_wallet_address_idx"
    ON "public"."canton_party_verifications" USING "btree" ("user_id", "canton_wallet_address")
    WHERE "is_discoverable" = TRUE;