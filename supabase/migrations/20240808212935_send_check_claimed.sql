CREATE TABLE "public"."send_check_claimed" (
    chain_id numeric,
    block_time numeric,
    tx_hash bytea,
    log_addr bytea,
    token bytea,
    amount numeric,
    "from" bytea,
    redeemer bytea
);

ALTER TABLE "public"."send_check_claimed" ENABLE ROW LEVEL SECURITY;

-- Policy for viewing claimed checks: Users can only select their own claimed checks
CREATE POLICY "Users can see their own claimed checks" ON "public"."send_check_claimed" FOR
SELECT USING (
    lower(concat('0x', encode(send_check_claimed.redeemer, 'hex')))::citext in (
        SELECT send_accounts.address FROM send_accounts
        WHERE (
            send_accounts.user_id = (
              SELECT
                auth.uid () AS uid
            )
          )
    )
);