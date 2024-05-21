revoke delete on table "public"."send_transfer_logs" from "anon";

revoke insert on table "public"."send_transfer_logs" from "anon";

revoke references on table "public"."send_transfer_logs" from "anon";

revoke select on table "public"."send_transfer_logs" from "anon";

revoke trigger on table "public"."send_transfer_logs" from "anon";

revoke truncate on table "public"."send_transfer_logs" from "anon";

revoke update on table "public"."send_transfer_logs" from "anon";

revoke delete on table "public"."send_transfer_logs" from "authenticated";

revoke insert on table "public"."send_transfer_logs" from "authenticated";

revoke references on table "public"."send_transfer_logs" from "authenticated";

revoke select on table "public"."send_transfer_logs" from "authenticated";

revoke trigger on table "public"."send_transfer_logs" from "authenticated";

revoke truncate on table "public"."send_transfer_logs" from "authenticated";

revoke update on table "public"."send_transfer_logs" from "authenticated";

revoke delete on table "public"."send_transfer_logs" from "service_role";

revoke insert on table "public"."send_transfer_logs" from "service_role";

revoke references on table "public"."send_transfer_logs" from "service_role";

revoke select on table "public"."send_transfer_logs" from "service_role";

revoke trigger on table "public"."send_transfer_logs" from "service_role";

revoke truncate on table "public"."send_transfer_logs" from "service_role";

revoke update on table "public"."send_transfer_logs" from "service_role";

alter table "public"."send_transfer_logs" drop constraint "send_transfer_logs_block_hash_check";

alter table "public"."send_transfer_logs" drop constraint "send_transfer_logs_from_check";

alter table "public"."send_transfer_logs" drop constraint "send_transfer_logs_to_check";

alter table "public"."send_transfer_logs" drop constraint "send_transfer_logs_tx_hash_check";

drop function if exists "public"."insert_send_transfer_logs"(_send_transfer_logs send_transfer_logs[]);

alter table "public"."send_transfer_logs" drop constraint "send_transfer_logs_pkey";

drop index if exists "public"."send_transfer_logs_block_number_idx";

drop index if exists "public"."send_transfer_logs_block_timestamp_idx";

drop index if exists "public"."send_transfer_logs_from_idx";

drop index if exists "public"."send_transfer_logs_pkey";

drop index if exists "public"."send_transfer_logs_to_idx";

drop table "public"."send_transfer_logs";


