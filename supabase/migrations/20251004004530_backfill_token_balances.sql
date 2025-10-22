SELECT insert_verification_value(
  distribution_number => 20,
  type => 'send_token_hodler'::public.verification_type,
  multiplier_min => 0,
  multiplier_max => 0,
  multiplier_step => 0
);


-- Data backfill: populate token_balances from historical send_token_transfers
-- Goal: sum all transfers (in - out since account creation) for SEND token and upsert into token_balances
-- Safe to re-run: uses ON CONFLICT to overwrite balance with final sum.

DO $$
BEGIN
  -- Ensure the token_balances table exists (created in prior migration); if not, abort early
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'token_balances'
  ) THEN
    RAISE NOTICE 'token_balances does not exist; skipping backfill.';
    RETURN;
  END IF;

  WITH send_token AS (
    SELECT decode('Eab49138BA2Ea6dd776220fE26b7b8E446638956','hex') AS token
  ),
  sa AS (
    SELECT sa.user_id,
           sa.address,
           sa.chain_id,
           decode(replace(sa.address::text,'0x',''),'hex') AS addr_bytea
    FROM public.send_accounts sa
  ),
  di AS (
    SELECT sa.user_id,
           sa.address,
           sa.chain_id,
           SUM(stt.v)::numeric AS amt_in,
           MAX(stt.block_time) AS max_bt
    FROM sa
    JOIN public.send_account_created sac ON sac.account = sa.addr_bytea
    JOIN public.send_token_transfers stt
      ON stt.t = sa.addr_bytea
     AND stt.log_addr = (SELECT token FROM send_token)
     AND stt.block_num >= sac.block_num
    GROUP BY sa.user_id, sa.address, sa.chain_id
  ),
  dout AS (
    SELECT sa.user_id,
           sa.address,
           sa.chain_id,
           SUM(stt.v)::numeric AS amt_out,
           MAX(stt.block_time) AS max_bt
    FROM sa
    JOIN public.send_account_created sac ON sac.account = sa.addr_bytea
    JOIN public.send_token_transfers stt
      ON stt.f = sa.addr_bytea
     AND stt.log_addr = (SELECT token FROM send_token)
     AND stt.block_num >= sac.block_num
    GROUP BY sa.user_id, sa.address, sa.chain_id
  ),
  final AS (
    SELECT COALESCE(di.user_id, dout.user_id)   AS user_id,
           COALESCE(di.address, dout.address)   AS address,
           COALESCE(di.chain_id, dout.chain_id) AS chain_id,
           (COALESCE(di.amt_in, 0) - COALESCE(dout.amt_out, 0))::numeric AS balance,
           GREATEST(COALESCE(di.max_bt, 0), COALESCE(dout.max_bt, 0))     AS max_block_time
    FROM di
    FULL OUTER JOIN dout ON di.user_id = dout.user_id
                        AND di.address = dout.address
                        AND di.chain_id = dout.chain_id
  ),
  -- ETH/native deposits: sum receives where recipient is a Send Account and sender is NOT a Send Account
  eth_dep AS (
    SELECT sa.user_id,
           sa.address,
           sa.chain_id,
           SUM(rec.value)::numeric AS amt_dep,
           MAX(rec.block_time)     AS max_bt
    FROM sa
    JOIN public.send_account_created sac ON sac.account = sa.addr_bytea
    JOIN public.send_account_receives rec
      ON rec.log_addr = sa.addr_bytea
     AND rec.chain_id = sa.chain_id
     AND rec.block_num >= sac.block_num
    LEFT JOIN public.send_accounts sa_sender
      ON sa_sender.address = concat('0x', encode(rec.sender, 'hex'))::citext
     AND sa_sender.chain_id = sa.chain_id
    WHERE sa_sender.id IS NULL -- deposits only (external → Send Account)
    GROUP BY sa.user_id, sa.address, sa.chain_id
  )
  -- Insert SEND token balances
  INSERT INTO public.token_balances(user_id, address, chain_id, token, balance, updated_at)
  SELECT f.user_id,
         f.address,
         f.chain_id,
         (SELECT token FROM send_token),
         f.balance,
         CASE WHEN f.max_block_time > 0 THEN to_timestamp(f.max_block_time) AT TIME ZONE 'UTC'
              ELSE now() AT TIME ZONE 'UTC' END
  FROM final f
  ON CONFLICT (user_id, token_key) DO UPDATE
    SET balance    = EXCLUDED.balance,
        address    = EXCLUDED.address,
        chain_id   = EXCLUDED.chain_id,
        updated_at = EXCLUDED.updated_at;

  -- Insert ETH/native deposit balances (token = NULL)
  WITH sa AS (
    SELECT sa.user_id,
           sa.address,
           sa.chain_id,
           decode(replace(sa.address::text,'0x',''),'hex') AS addr_bytea
    FROM public.send_accounts sa
  ),
  eth_dep AS (
    SELECT sa.user_id,
           sa.address,
           sa.chain_id,
           SUM(rec.value)::numeric AS amt_dep,
           MAX(rec.block_time)     AS max_bt
    FROM sa
    JOIN public.send_account_created sac ON sac.account = sa.addr_bytea
    JOIN public.send_account_receives rec
      ON rec.log_addr = sa.addr_bytea
     AND rec.chain_id = sa.chain_id
     AND rec.block_num >= sac.block_num
    LEFT JOIN public.send_accounts sa_sender
      ON sa_sender.address = concat('0x', encode(rec.sender, 'hex'))::citext
     AND sa_sender.chain_id = sa.chain_id
    WHERE sa_sender.id IS NULL -- deposits only (external → Send Account)
    GROUP BY sa.user_id, sa.address, sa.chain_id
  )
  INSERT INTO public.token_balances(user_id, address, chain_id, token, balance, updated_at)
  SELECT ed.user_id,
         ed.address,
         ed.chain_id,
         NULL AS token,
         ed.amt_dep,
         CASE WHEN ed.max_bt > 0 THEN to_timestamp(ed.max_bt) AT TIME ZONE 'UTC'
              ELSE now() AT TIME ZONE 'UTC' END
  FROM eth_dep ed
  ON CONFLICT (user_id, token_key) DO UPDATE
    SET balance    = public.token_balances.balance + EXCLUDED.balance,
        address    = EXCLUDED.address,
        chain_id   = EXCLUDED.chain_id,
        updated_at = EXCLUDED.updated_at;
END $$;
