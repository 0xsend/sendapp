CREATE TABLE coinbase_transactions (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    transaction_id text NOT NULL UNIQUE,
    purchase_amount numeric NOT NULL,
    purchase_currency text NOT NULL,
    payment_total numeric NOT NULL, 
    payment_currency text NOT NULL,
    payment_method text NOT NULL CHECK (payment_method IN ('CARD', 'ACH_BANK_ACCOUNT', 'APPLE_PAY', 'FIAT_WALLET', 'CRYPTO_WALLET')),
    wallet_address text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
