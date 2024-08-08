CREATE TABLE "public"."send_check_created" (
    chain_id numeric,
    block_time numeric,
    tx_hash bytea,
    log_addr bytea,
    token bytea,
    amount numeric,
    "from" bytea
);

ALTER TABLE "public"."send_check_created" ENABLE ROW LEVEL SECURITY;

-- Policy for viewing created checks: Users can only select their own created checks
CREATE POLICY "Users can see their own created checks" ON "public"."send_check_created" FOR
SELECT USING (
    lower(concat('0x', encode(send_check_created.from, 'hex')))::citext in (
        SELECT send_accounts.address FROM send_accounts
        WHERE (
            send_accounts.user_id = (
              SELECT
                auth.uid () AS uid
            )
          )
    )
);