create sequence "public"."referrals_id_seq";

alter table "public"."referrals"
add column "id" integer not null default nextval('referrals_id_seq'::regclass);

alter sequence "public"."referrals_id_seq" owned by "public"."referrals"."id";

CREATE UNIQUE INDEX referrals_pkey ON public.referrals USING btree (id);

alter table "public"."referrals"
add constraint "referrals_pkey" PRIMARY KEY using index "referrals_pkey";
