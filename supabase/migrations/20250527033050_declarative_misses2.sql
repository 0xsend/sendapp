alter table "public"."tags" drop constraint "tags_name_check";

alter table "public"."tags" add constraint "tags_name_check" CHECK (((length((name)::text) >= 1) AND (length((name)::text) <= 20) AND (name ~ '^[A-Za-z0-9_]+$'::citext))) not valid;

alter table "public"."tags" validate constraint "tags_name_check";


grant delete on table "temporal"."send_account_transfers" to "anon";

grant insert on table "temporal"."send_account_transfers" to "anon";

grant references on table "temporal"."send_account_transfers" to "anon";

grant select on table "temporal"."send_account_transfers" to "anon";

grant trigger on table "temporal"."send_account_transfers" to "anon";

grant truncate on table "temporal"."send_account_transfers" to "anon";

grant update on table "temporal"."send_account_transfers" to "anon";

grant delete on table "temporal"."send_account_transfers" to "authenticated";

grant insert on table "temporal"."send_account_transfers" to "authenticated";

grant references on table "temporal"."send_account_transfers" to "authenticated";

grant trigger on table "temporal"."send_account_transfers" to "authenticated";

grant truncate on table "temporal"."send_account_transfers" to "authenticated";

grant update on table "temporal"."send_account_transfers" to "authenticated";

grant delete on table "temporal"."send_earn_deposits" to "anon";

grant insert on table "temporal"."send_earn_deposits" to "anon";

grant references on table "temporal"."send_earn_deposits" to "anon";

grant select on table "temporal"."send_earn_deposits" to "anon";

grant trigger on table "temporal"."send_earn_deposits" to "anon";

grant truncate on table "temporal"."send_earn_deposits" to "anon";

grant update on table "temporal"."send_earn_deposits" to "anon";

grant delete on table "temporal"."send_earn_deposits" to "authenticated";

grant insert on table "temporal"."send_earn_deposits" to "authenticated";

grant references on table "temporal"."send_earn_deposits" to "authenticated";

grant select on table "temporal"."send_earn_deposits" to "authenticated";

grant trigger on table "temporal"."send_earn_deposits" to "authenticated";

grant truncate on table "temporal"."send_earn_deposits" to "authenticated";

grant update on table "temporal"."send_earn_deposits" to "authenticated";


