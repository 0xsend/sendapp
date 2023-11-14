drop index if exists "public"."distribution_shares_address_idx";

drop index if exists "public"."distribution_shares_user_id_idx";

CREATE UNIQUE INDEX distribution_shares_address_idx ON public.distribution_shares USING btree (address, distribution_id);

CREATE UNIQUE INDEX distribution_shares_user_id_idx ON public.distribution_shares USING btree (user_id, distribution_id);
