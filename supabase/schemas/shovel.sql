-- Tables
CREATE TABLE IF NOT EXISTS "shovel"."ig_updates" (
    "name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "backfill" boolean DEFAULT false,
    "num" numeric NOT NULL,
    "latency" interval,
    "nrows" numeric,
    "stop" numeric
);
ALTER TABLE "shovel"."ig_updates" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "shovel"."integrations" (
    "name" "text",
    "conf" "jsonb"
);
ALTER TABLE "shovel"."integrations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "shovel"."task_updates" (
    "num" numeric,
    "hash" "bytea",
    "insert_at" timestamp with time zone DEFAULT "now"(),
    "src_hash" "bytea",
    "src_num" numeric,
    "nblocks" numeric,
    "nrows" numeric,
    "latency" interval,
    "src_name" "text",
    "stop" numeric,
    "chain_id" integer,
    "ig_name" "text"
);
ALTER TABLE "shovel"."task_updates" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "shovel"."sources" (
    "name" "text",
    "chain_id" integer,
    "url" "text"
);
ALTER TABLE "shovel"."sources" OWNER TO "postgres";

-- Indexes
CREATE UNIQUE INDEX "intg_name_src_name_backfill_num_idx" ON "shovel"."ig_updates" USING "btree" ("name", "src_name", "backfill", "num" DESC);
CREATE UNIQUE INDEX "sources_name_chain_id_idx" ON "shovel"."sources" USING "btree" ("name", "chain_id");
CREATE UNIQUE INDEX "sources_name_idx" ON "shovel"."sources" USING "btree" ("name");
CREATE UNIQUE INDEX "task_src_name_num_idx" ON "shovel"."task_updates" USING "btree" ("ig_name", "src_name", "num" DESC);

-- Views
CREATE OR REPLACE VIEW "shovel"."latest" AS
 WITH "abs_latest" AS (
         SELECT "task_updates"."src_name",
            "max"("task_updates"."num") AS "num"
           FROM "shovel"."task_updates"
          GROUP BY "task_updates"."src_name"
        ), "src_latest" AS (
         SELECT "task_updates"."src_name",
            "max"("task_updates"."num") AS "num"
           FROM "shovel"."task_updates",
            "abs_latest"
          WHERE (("task_updates"."src_name" = "abs_latest"."src_name") AND (("abs_latest"."num" - "task_updates"."num") <= (10)::numeric))
          GROUP BY "task_updates"."src_name", "task_updates"."ig_name"
        )
 SELECT "src_latest"."src_name",
    "min"("src_latest"."num") AS "num"
   FROM "src_latest"
  GROUP BY "src_latest"."src_name";
ALTER TABLE "shovel"."latest" OWNER TO "postgres";

CREATE OR REPLACE VIEW "shovel"."source_updates" AS
 SELECT DISTINCT ON ("task_updates"."src_name") "task_updates"."src_name",
    "task_updates"."num",
    "task_updates"."hash",
    "task_updates"."src_num",
    "task_updates"."src_hash",
    "task_updates"."nblocks",
    "task_updates"."nrows",
    "task_updates"."latency"
   FROM "shovel"."task_updates"
  ORDER BY "task_updates"."src_name", "task_updates"."num" DESC;
ALTER TABLE "shovel"."source_updates" OWNER TO "postgres";