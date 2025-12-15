alter table "public"."distribution_shares" drop constraint "distribution_shares_user_id_fkey";

alter table "public"."distributions" add column "merkle_tree" jsonb;

ALTER TABLE ONLY "public"."distribution_shares" ADD CONSTRAINT "distribution_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION NOT VALID;
