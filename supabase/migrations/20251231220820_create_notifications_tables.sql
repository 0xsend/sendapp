create type "public"."notification_type" as enum ('transfer_sent', 'transfer_received', 'tag_confirmed', 'account_activity', 'system');

create type "public"."push_token_platform" as enum ('expo', 'web');

create sequence "public"."notifications_id_seq";

create sequence "public"."push_tokens_id_seq";

create table "public"."notifications" (
    "id" bigint not null default nextval('notifications_id_seq'::regclass),
    "user_id" uuid not null,
    "type" notification_type not null,
    "title" text not null,
    "body" text not null,
    "data" jsonb,
    "read" boolean not null default false,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP
);


alter table "public"."notifications" enable row level security;

create table "public"."push_tokens" (
    "id" bigint not null default nextval('push_tokens_id_seq'::regclass),
    "user_id" uuid not null,
    "platform" push_token_platform not null,
    "token" text,
    "endpoint" text,
    "p256dh" text,
    "auth" text,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone not null default CURRENT_TIMESTAMP
);


alter table "public"."push_tokens" enable row level security;

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."push_tokens_id_seq" owned by "public"."push_tokens"."id";

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id, created_at);

CREATE INDEX notifications_user_id_read_idx ON public.notifications USING btree (user_id, read);

CREATE UNIQUE INDEX push_tokens_pkey ON public.push_tokens USING btree (id);

CREATE INDEX push_tokens_user_id_idx ON public.push_tokens USING btree (user_id);

CREATE UNIQUE INDEX push_tokens_user_platform_endpoint_idx ON public.push_tokens USING btree (user_id, platform, endpoint) WHERE (endpoint IS NOT NULL);

CREATE UNIQUE INDEX push_tokens_user_platform_token_idx ON public.push_tokens USING btree (user_id, platform, token) WHERE (token IS NOT NULL);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."push_tokens" add constraint "push_tokens_pkey" PRIMARY KEY using index "push_tokens_pkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."push_tokens" add constraint "push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."push_tokens" validate constraint "push_tokens_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_push_token_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."push_tokens" to "anon";

grant insert on table "public"."push_tokens" to "anon";

grant references on table "public"."push_tokens" to "anon";

grant select on table "public"."push_tokens" to "anon";

grant trigger on table "public"."push_tokens" to "anon";

grant truncate on table "public"."push_tokens" to "anon";

grant update on table "public"."push_tokens" to "anon";

grant delete on table "public"."push_tokens" to "authenticated";

grant insert on table "public"."push_tokens" to "authenticated";

grant references on table "public"."push_tokens" to "authenticated";

grant select on table "public"."push_tokens" to "authenticated";

grant trigger on table "public"."push_tokens" to "authenticated";

grant truncate on table "public"."push_tokens" to "authenticated";

grant update on table "public"."push_tokens" to "authenticated";

grant delete on table "public"."push_tokens" to "service_role";

grant insert on table "public"."push_tokens" to "service_role";

grant references on table "public"."push_tokens" to "service_role";

grant select on table "public"."push_tokens" to "service_role";

grant trigger on table "public"."push_tokens" to "service_role";

grant truncate on table "public"."push_tokens" to "service_role";

grant update on table "public"."push_tokens" to "service_role";

create policy "Users can delete their own notifications"
on "public"."notifications"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own notifications"
on "public"."notifications"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can delete their own push tokens"
on "public"."push_tokens"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own push tokens"
on "public"."push_tokens"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own push tokens"
on "public"."push_tokens"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own push tokens"
on "public"."push_tokens"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION update_push_token_updated_at();


