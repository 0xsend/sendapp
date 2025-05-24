create table "public"."send_check_claimed" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" bytea NOT NULL,
    "log_addr" bytea NOT NULL,
    "token" bytea NOT NULL,
    "amount" numeric NOT NULL,
    "from" bytea NOT NULL,
    "redeemer" bytea NOT NULL,
    "ig_name" text NOT NULL,
    "src_name" text NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" text GENERATED ALWAYS AS (((((((((ig_name || '/'::text) || src_name) || '/'::text) || (block_num)::text) || '/'::text) || (tx_idx)::text) || '/'::text) || (log_idx)::text)) STORED NOT NULL
);

CREATE SEQUENCE public.send_check_claimed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.send_check_claimed_id_seq OWNED BY public.send_check_claimed.id;
ALTER TABLE ONLY public.send_check_claimed ALTER COLUMN id SET DEFAULT nextval('public.send_check_claimed'::regclass);
ALTER TABLE ONLY public.send_check_claimed ADD CONSTRAINT send_check_claimed_pkey PRIMARY KEY (id);

create table "public"."send_check_created" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" bytea NOT NULL,
    "log_addr" bytea NOT NULL,
    "token" bytea NOT NULL,
    "amount" numeric NOT NULL,
    "from" bytea NOT NULL,
    "ig_name" text NOT NULL,
    "src_name" text NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" text GENERATED ALWAYS AS (((((((((ig_name || '/'::text) || src_name) || '/'::text) || (block_num)::text) || '/'::text) || (tx_idx)::text) || '/'::text) || (log_idx)::text)) STORED NOT NULL
);

CREATE SEQUENCE public.send_check_created_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.send_check_created_id_seq OWNED BY public.send_check_created.id;
ALTER TABLE ONLY public.send_check_created ALTER COLUMN id SET DEFAULT nextval('public.send_check_created'::regclass);
ALTER TABLE ONLY public.send_check_created ADD CONSTRAINT send_check_created_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX u_send_check_claimed ON public.send_check_claimed USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);
CREATE INDEX send_check_claimed_redeemer_idx ON public.send_check_claimed USING btree (redeemer);
CREATE UNIQUE INDEX u_send_check_created ON public.send_check_created USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);
CREATE INDEX send_check_created_from_idx ON public.send_check_created USING btree ("from");

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

