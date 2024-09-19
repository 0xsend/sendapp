CREATE TABLE "public"."affiliate_stats"(
    "paymaster_tx_count" integer NOT NULL DEFAULT 0 ::integer,
    "user_id" uuid,
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."affiliate_stats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can see own affiliate stats" ON affiliate_stats
    FOR SELECT
        USING (auth.uid() = user_id);

GRANT SELECT ON affiliate_stats TO authenticated;

CREATE UNIQUE INDEX affiliate_stats_pkey ON public.affiliate_stats USING btree(id);

ALTER TABLE "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_pkey" PRIMARY KEY USING INDEX "affiliate_stats_pkey";

ALTER TABLE "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE NOT valid;

ALTER TABLE "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_user_id_key" UNIQUE ("user_id");

ALTER TABLE "public"."affiliate_stats" validate CONSTRAINT "affiliate_stats_user_id_fkey";

INSERT INTO affiliate_stats(user_id, paymaster_tx_count)
SELECT
    au.id AS user_id,
    COALESCE(COUNT(activity.*) FILTER (WHERE activity.event_name = 'send_account_transfers'
            AND (activity.data ->> 't' IN ('\x592e1224d203be4214b15e205f6081fbbacfcd2d', '\x4c99cdaab0cfe32b4ba77d30342b5c51e0444e5b'))), 0) AS paymaster_tx_count
FROM
    auth.users au
    LEFT JOIN activity ON activity.from_user_id = au.id
GROUP BY
    au.id;

