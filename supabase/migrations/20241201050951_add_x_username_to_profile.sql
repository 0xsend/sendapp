alter table "public"."profiles" add column "x_username" text;

alter table "public"."profiles" add constraint "profiles_x_username_update" CHECK ((length(x_username) <= 64)) not valid;

alter table "public"."profiles" validate constraint "profiles_x_username_update";


