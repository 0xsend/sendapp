-- Add balance reconciliation system for handling rebasing tokens and missed transactions
-- This migration adds snapshot tracking and reconciliation adjustments

-- =============================================================================
-- Table: erc20_balance_snapshots
-- Periodic RPC-based balance snapshots (source of truth)
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."erc20_balance_snapshots" (
    "send_account_address" bytea NOT NULL,
    "chain_id" numeric NOT NULL,
    "token_address" bytea NOT NULL,
    "balance" numeric NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL DEFAULT now(),
    "snapshot_block" numeric NOT NULL,
    "drift_from_calculated" numeric, -- difference from erc20_balances
    CONSTRAINT "erc20_balance_snapshots_pkey" PRIMARY KEY ("send_account_address", "chain_id", "token_address", "snapshot_time"),
    CONSTRAINT "erc20_balance_snapshots_token_fkey" FOREIGN KEY ("token_address", "chain_id")
        REFERENCES "public"."erc20_tokens"("address", "chain_id") ON DELETE CASCADE
);

-- Indexes for snapshots
CREATE INDEX "erc20_balance_snapshots_time_idx" ON "public"."erc20_balance_snapshots"
    USING btree("snapshot_time" DESC);

CREATE INDEX "erc20_balance_snapshots_address_token_idx" ON "public"."erc20_balance_snapshots"
    USING btree("send_account_address", "chain_id", "token_address", "snapshot_time" DESC);

-- RLS policies for snapshots
ALTER TABLE "public"."erc20_balance_snapshots" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own snapshots" ON "public"."erc20_balance_snapshots"
FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM send_accounts sa
        WHERE lower(concat('0x', encode(erc20_balance_snapshots.send_account_address, 'hex')))::citext = sa.address
            AND sa.user_id = auth.uid()
            AND sa.chain_id = erc20_balance_snapshots.chain_id
    )
);

-- =============================================================================
-- View: erc20_balance_latest_snapshot
-- Latest snapshot for each address/token pair
-- =============================================================================

CREATE OR REPLACE VIEW "public"."erc20_balance_latest_snapshot" AS
SELECT DISTINCT ON (send_account_address, chain_id, token_address)
    send_account_address,
    chain_id,
    token_address,
    balance AS snapshot_balance,
    snapshot_time,
    snapshot_block,
    drift_from_calculated
FROM erc20_balance_snapshots
ORDER BY send_account_address, chain_id, token_address, snapshot_time DESC;

-- =============================================================================
-- Table: erc20_balance_reconciliations
-- Track all balance corrections and their reasons
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."erc20_balance_reconciliations" (
    "id" bigserial PRIMARY KEY,
    "send_account_address" bytea NOT NULL,
    "chain_id" numeric NOT NULL,
    "token_address" bytea NOT NULL,
    -- What was wrong
    "drift_amount" numeric NOT NULL, -- positive = DB was too low
    "db_balance_before" numeric NOT NULL,
    "rpc_balance" numeric NOT NULL,
    -- Why it happened
    "reconciliation_reason" text, -- 'rebasing', 'missed_transfer', 'indexing_lag', 'unknown'
    -- When it was fixed
    "reconciled_at" timestamp with time zone NOT NULL DEFAULT now(),
    "reconciled_block" numeric NOT NULL,
    CONSTRAINT "erc20_balance_reconciliations_token_fkey" FOREIGN KEY ("token_address", "chain_id")
        REFERENCES "public"."erc20_tokens"("address", "chain_id") ON DELETE CASCADE
);

-- Indexes for reconciliations
CREATE INDEX "erc20_balance_reconciliations_time_idx" ON "public"."erc20_balance_reconciliations"
    USING btree("reconciled_at" DESC);

CREATE INDEX "erc20_balance_reconciliations_address_token_idx" ON "public"."erc20_balance_reconciliations"
    USING btree("send_account_address", "chain_id", "token_address");

CREATE INDEX "erc20_balance_reconciliations_reason_idx" ON "public"."erc20_balance_reconciliations"
    USING btree("reconciliation_reason");

-- RLS policies for reconciliations
ALTER TABLE "public"."erc20_balance_reconciliations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own reconciliations" ON "public"."erc20_balance_reconciliations"
FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM send_accounts sa
        WHERE lower(concat('0x', encode(erc20_balance_reconciliations.send_account_address, 'hex')))::citext = sa.address
            AND sa.user_id = auth.uid()
            AND sa.chain_id = erc20_balance_reconciliations.chain_id
    )
);

-- =============================================================================
-- Add rebasing token flag to erc20_tokens
-- =============================================================================

ALTER TABLE "public"."erc20_tokens"
ADD COLUMN IF NOT EXISTS "is_rebasing" boolean DEFAULT false;

-- =============================================================================
-- Function: Apply balance reconciliation
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."apply_balance_reconciliation"(
    p_send_account_address bytea,
    p_chain_id numeric,
    p_token_address bytea,
    p_adjustment numeric,
    p_block_num numeric
) RETURNS void AS $$
BEGIN
    -- Simply adjust the balance by the drift amount
    UPDATE erc20_balances
    SET
        balance = balance + p_adjustment,
        last_updated_block = p_block_num,
        last_updated_time = now()
    WHERE send_account_address = p_send_account_address
      AND chain_id = p_chain_id
      AND token_address = p_token_address;

    -- If no row exists (newly discovered), insert with RPC balance
    IF NOT FOUND THEN
        INSERT INTO erc20_balances (
            send_account_address,
            chain_id,
            token_address,
            balance,
            last_updated_block,
            last_updated_time
        ) VALUES (
            p_send_account_address,
            p_chain_id,
            p_token_address,
            p_adjustment, -- This is the full RPC balance in this case
            p_block_num,
            now()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Function: Get balances needing reconciliation
-- Prioritizes by: rebasing tokens > high USD value > recent activity > staleness
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."get_balances_to_reconcile"(
    p_limit integer DEFAULT 100
) RETURNS TABLE(
    send_account_address bytea,
    chain_id numeric,
    token_address bytea,
    calculated_balance numeric,
    is_rebasing boolean,
    last_snapshot timestamp with time zone,
    usd_value numeric,
    last_updated_time timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        eb.send_account_address,
        eb.chain_id,
        eb.token_address,
        eb.balance AS calculated_balance,
        COALESCE(et.is_rebasing, false) AS is_rebasing,
        COALESCE(ls.snapshot_time, '1970-01-01'::timestamp with time zone) AS last_snapshot,
        COALESCE(etm.price_usd * eb.balance / power(10, COALESCE(et.decimals, 18)), 0) AS usd_value,
        eb.last_updated_time
    FROM erc20_balances eb
    JOIN erc20_tokens et ON et.address = eb.token_address AND et.chain_id = eb.chain_id
    LEFT JOIN erc20_token_metadata etm ON etm.token_address = eb.token_address AND etm.chain_id = eb.chain_id
    LEFT JOIN erc20_balance_latest_snapshot ls ON
        ls.send_account_address = eb.send_account_address
        AND ls.chain_id = eb.chain_id
        AND ls.token_address = eb.token_address
    WHERE eb.balance > 0
    ORDER BY
        COALESCE(et.is_rebasing, false) DESC,                    -- Rebasing tokens first
        COALESCE(etm.price_usd * eb.balance / power(10, COALESCE(et.decimals, 18)), 0) DESC, -- High value second
        eb.last_updated_time DESC,                               -- Recent activity third
        COALESCE(ls.snapshot_time, '1970-01-01'::timestamp with time zone) ASC  -- Stale snapshots last
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Function: Store balance snapshot
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."store_balance_snapshot"(
    p_send_account_address bytea,
    p_chain_id numeric,
    p_token_address bytea,
    p_balance numeric,
    p_snapshot_block numeric,
    p_drift_from_calculated numeric
) RETURNS void AS $$
BEGIN
    INSERT INTO erc20_balance_snapshots (
        send_account_address,
        chain_id,
        token_address,
        balance,
        snapshot_block,
        drift_from_calculated,
        snapshot_time
    ) VALUES (
        p_send_account_address,
        p_chain_id,
        p_token_address,
        p_balance,
        p_snapshot_block,
        p_drift_from_calculated,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Function: Store reconciliation record
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."store_reconciliation"(
    p_send_account_address bytea,
    p_chain_id numeric,
    p_token_address bytea,
    p_drift_amount numeric,
    p_db_balance_before numeric,
    p_rpc_balance numeric,
    p_reconciliation_reason text,
    p_reconciled_block numeric
) RETURNS bigint AS $$
DECLARE
    v_reconciliation_id bigint;
BEGIN
    INSERT INTO erc20_balance_reconciliations (
        send_account_address,
        chain_id,
        token_address,
        drift_amount,
        db_balance_before,
        rpc_balance,
        reconciliation_reason,
        reconciled_block,
        reconciled_at
    ) VALUES (
        p_send_account_address,
        p_chain_id,
        p_token_address,
        p_drift_amount,
        p_db_balance_before,
        p_rpc_balance,
        p_reconciliation_reason,
        p_reconciled_block,
        now()
    ) RETURNING id INTO v_reconciliation_id;

    RETURN v_reconciliation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grants
-- =============================================================================

GRANT ALL ON TABLE "public"."erc20_balance_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."erc20_balance_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."erc20_balance_snapshots" TO "service_role";

GRANT ALL ON TABLE "public"."erc20_balance_reconciliations" TO "anon";
GRANT ALL ON TABLE "public"."erc20_balance_reconciliations" TO "authenticated";
GRANT ALL ON TABLE "public"."erc20_balance_reconciliations" TO "service_role";

GRANT SELECT ON "public"."erc20_balance_latest_snapshot" TO "anon";
GRANT SELECT ON "public"."erc20_balance_latest_snapshot" TO "authenticated";
GRANT SELECT ON "public"."erc20_balance_latest_snapshot" TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."apply_balance_reconciliation"(bytea, numeric, bytea, numeric, numeric) TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."get_balances_to_reconcile"(integer) TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."store_balance_snapshot"(bytea, numeric, bytea, numeric, numeric, numeric) TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."store_reconciliation"(bytea, numeric, bytea, numeric, numeric, numeric, text, numeric) TO "service_role";
