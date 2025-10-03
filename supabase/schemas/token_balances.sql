-- token_balances (Temporal-driven): single source-of-truth rows
-- Keep reads simple; balances are written by Temporal activities after
-- confirmed transfers. No advancer/cursor/functions here.

-- Balances table (global per-user balances per token or native asset)
CREATE TABLE IF NOT EXISTS public.token_balances (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  address public.citext NOT NULL,
  chain_id integer NOT NULL,
  token bytea NULL, -- NULL reserved for native ETH in future
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  token_key text GENERATED ALWAYS AS (
    CASE WHEN token IS NULL THEN 'eth' ELSE encode(token, 'hex') END
  ) STORED
);

-- Foreign keys
ALTER TABLE ONLY public.token_balances
  ADD CONSTRAINT token_balances_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.token_balances
  ADD CONSTRAINT token_balances_address_chain_fkey FOREIGN KEY (address, chain_id)
  REFERENCES public.send_accounts(address, chain_id) ON DELETE CASCADE;

-- Helpful indexes and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS token_balances_user_token_key_uniq
  ON public.token_balances (user_id, token_key);
CREATE INDEX IF NOT EXISTS token_balances_token_user_idx
  ON public.token_balances (token, user_id);
CREATE INDEX IF NOT EXISTS token_balances_token_balance_idx
  ON public.token_balances (token, balance);
CREATE INDEX IF NOT EXISTS token_balances_address_idx
  ON public.token_balances (address, chain_id);

-- Enable direct SELECT with RLS: users see their own rows
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'token_balances'
      AND policyname = 'Users can see their own token balances'
  ) THEN
    CREATE POLICY "Users can see their own token balances"
      ON public.token_balances
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON TABLE "public"."token_balances" TO "anon";
GRANT ALL ON TABLE "public"."token_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."token_balances" TO "service_role";
