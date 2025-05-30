-- Table
CREATE TABLE IF NOT EXISTS "public"."swap_routers" (
    "router_addr" "bytea" NOT NULL,
    "chain_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."swap_routers" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."swap_routers"
    ADD CONSTRAINT "swap_routers_pkey" PRIMARY KEY ("router_addr", "chain_id");

-- RLS
ALTER TABLE "public"."swap_routers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access to authenticated users" ON "public"."swap_routers" FOR SELECT TO "authenticated" USING (true);

-- Grants
GRANT ALL ON TABLE "public"."swap_routers" TO "anon";
GRANT ALL ON TABLE "public"."swap_routers" TO "authenticated";
GRANT ALL ON TABLE "public"."swap_routers" TO "service_role";