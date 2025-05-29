-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."receipts_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "hash" "public"."citext",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" NOT NULL,
    CONSTRAINT "receipts_hash_check" CHECK ((("length"(("hash")::"text") = 66) AND ("hash" OPERATOR("public".~) '^0x[A-Fa-f0-9]{64}$'::"public"."citext")))
);
ALTER TABLE "public"."receipts" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."receipts_id_seq" OWNED BY "public"."receipts"."id";
ALTER TABLE ONLY "public"."receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."receipts_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE UNIQUE INDEX "receipts_event_id_idx" ON "public"."receipts" USING "btree" ("event_id");
CREATE INDEX "receipts_user_id_idx" ON "public"."receipts" USING "btree" ("user_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receipts are viewable by users." ON "public"."receipts" FOR SELECT USING (("auth"."uid"() = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."receipts_id_seq" TO "service_role";