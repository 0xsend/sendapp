alter table "public"."contact_labels" alter column "owner_id" set default auth.uid();

alter table "public"."contacts" alter column "owner_id" set default auth.uid();


