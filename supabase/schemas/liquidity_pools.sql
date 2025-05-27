-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_liquidity_pools_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_liquidity_pools_id_seq" OWNER TO "postgres";

-- Tables
CREATE TABLE IF NOT EXISTS "public"."liquidity_pools" (
    "pool_name" "text" NOT NULL,
    "pool_type" "text" NOT NULL,
    "pool_addr" "bytea" NOT NULL,
    "chain_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."liquidity_pools" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."send_liquidity_pools" (
    "id" integer NOT NULL,
    "address" "bytea" NOT NULL,
    "chain_id" integer NOT NULL
);
ALTER TABLE "public"."send_liquidity_pools" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_liquidity_pools_id_seq" OWNED BY "public"."send_liquidity_pools"."id";
ALTER TABLE ONLY "public"."send_liquidity_pools" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_liquidity_pools_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."liquidity_pools"
    ADD CONSTRAINT "liquidity_pools_pkey" PRIMARY KEY ("pool_addr", "chain_id");

ALTER TABLE ONLY "public"."send_liquidity_pools"
    ADD CONSTRAINT "send_liquidity_pools_pkey" PRIMARY KEY ("id");

-- RLS
ALTER TABLE "public"."liquidity_pools" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access to authenticated users" ON "public"."liquidity_pools" FOR SELECT TO "authenticated" USING (true);

alter table send_liquidity_pools enable row level security;

-- Grants
GRANT ALL ON TABLE "public"."liquidity_pools" TO "anon";
GRANT ALL ON TABLE "public"."liquidity_pools" TO "authenticated";
GRANT ALL ON TABLE "public"."liquidity_pools" TO "service_role";

GRANT ALL ON TABLE "public"."send_liquidity_pools" TO "anon";
GRANT ALL ON TABLE "public"."send_liquidity_pools" TO "authenticated";
GRANT ALL ON TABLE "public"."send_liquidity_pools" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_liquidity_pools_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_liquidity_pools_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_liquidity_pools_id_seq" TO "service_role";
