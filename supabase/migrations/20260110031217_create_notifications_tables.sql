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
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone
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
    "updated_at" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "device_id" text,
    "is_active" boolean not null default true,
    "last_used_at" timestamp with time zone
);


alter table "public"."push_tokens" enable row level security;

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."push_tokens_id_seq" owned by "public"."push_tokens"."id";

CREATE INDEX notifications_delivered_at_idx ON public.notifications USING btree (user_id, delivered_at) WHERE (delivered_at IS NOT NULL);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE INDEX notifications_read_at_idx ON public.notifications USING btree (user_id, read_at) WHERE (read_at IS NOT NULL);

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id, created_at);

CREATE INDEX notifications_user_id_read_idx ON public.notifications USING btree (user_id, read);

CREATE INDEX push_tokens_is_active_idx ON public.push_tokens USING btree (is_active) WHERE (is_active = true);

CREATE UNIQUE INDEX push_tokens_pkey ON public.push_tokens USING btree (id);

CREATE INDEX push_tokens_user_id_idx ON public.push_tokens USING btree (user_id);

CREATE UNIQUE INDEX push_tokens_user_platform_endpoint_idx ON public.push_tokens USING btree (user_id, platform, endpoint) WHERE (endpoint IS NOT NULL);

CREATE UNIQUE INDEX push_tokens_user_platform_token_idx ON public.push_tokens USING btree (user_id, platform, token) WHERE (token IS NOT NULL);

CREATE UNIQUE INDEX push_tokens_web_endpoint_unique_idx ON public.push_tokens USING btree (user_id, endpoint) WHERE (platform = 'web'::push_token_platform);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."push_tokens" add constraint "push_tokens_pkey" PRIMARY KEY using index "push_tokens_pkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."push_tokens" add constraint "push_tokens_platform_fields_check" CHECK ((((platform = 'expo'::push_token_platform) AND (token IS NOT NULL) AND (endpoint IS NULL) AND (p256dh IS NULL) AND (auth IS NULL)) OR ((platform = 'web'::push_token_platform) AND (token IS NULL) AND (endpoint IS NOT NULL) AND (p256dh IS NOT NULL) AND (auth IS NOT NULL)))) NOT VALID;

alter table "public"."push_tokens" add constraint "push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."push_tokens" validate constraint "push_tokens_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_stale_push_tokens()
 RETURNS TABLE(deleted_count bigint, deactivated_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_deleted bigint;
    v_deactivated bigint;
BEGIN
    -- Delete inactive tokens older than 90 days
    DELETE FROM push_tokens
    WHERE is_active = false
      AND updated_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    -- Mark active tokens unused for over 60 days as inactive
    UPDATE push_tokens
    SET is_active = false
    WHERE is_active = true
      AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '60 days');
    GET DIAGNOSTICS v_deactivated = ROW_COUNT;

    RETURN QUERY SELECT v_deleted, v_deactivated;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.register_push_token(token_value text, token_platform push_token_platform, token_device_id text DEFAULT NULL::text)
 RETURNS SETOF push_tokens
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_result push_tokens%ROWTYPE;
BEGIN
    IF token_platform = 'web'::push_token_platform THEN
        RAISE EXCEPTION 'Use upsert_web_push_token for web push subscriptions';
    END IF;

    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register push token';
    END IF;

    INSERT INTO push_tokens (
        user_id,
        platform,
        token,
        device_id,
        is_active,
        last_used_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        token_platform,
        token_value,
        token_device_id,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, platform, token) WHERE token IS NOT NULL
    DO UPDATE SET
        device_id = COALESCE(EXCLUDED.device_id, push_tokens.device_id),
        is_active = true,
        last_used_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN NEXT v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_push_token_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_web_push_token(p_endpoint text, p_p256dh text, p_auth text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    -- Derive user identity from auth context - prevents cross-user writes
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register web push token';
    END IF;

    INSERT INTO public.push_tokens (user_id, platform, token, endpoint, p256dh, auth, is_active, last_used_at)
    VALUES (v_user_id, 'web', NULL, p_endpoint, p_p256dh, p_auth, true, NOW())
    ON CONFLICT (user_id, endpoint) WHERE platform = 'web'
    DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        is_active = true,
        last_used_at = NOW(),
        updated_at = clock_timestamp();
END;
$function$
;

-- SECURITY: anon role has NO access to these tables
-- authenticated: minimal CRUD (RLS enforces row-level access)
-- service_role: full access for backend operations

grant select, insert, update, delete on table "public"."notifications" to "authenticated";
grant all on table "public"."notifications" to "service_role";

grant select, insert, update, delete on table "public"."push_tokens" to "authenticated";
grant all on table "public"."push_tokens" to "service_role";

grant usage on sequence "public"."notifications_id_seq" to "authenticated";
grant all on sequence "public"."notifications_id_seq" to "service_role";

grant usage on sequence "public"."push_tokens_id_seq" to "authenticated";
grant all on sequence "public"."push_tokens_id_seq" to "service_role";

-- Function grants
revoke all on function "public"."register_push_token"(text, push_token_platform, text) from public;
grant execute on function "public"."register_push_token"(text, push_token_platform, text) to "authenticated";
grant execute on function "public"."register_push_token"(text, push_token_platform, text) to "service_role";

revoke all on function "public"."upsert_web_push_token"(text, text, text) from public;
grant execute on function "public"."upsert_web_push_token"(text, text, text) to "authenticated";
grant execute on function "public"."upsert_web_push_token"(text, text, text) to "service_role";

-- SECURITY: Only service_role can run cleanup (maintenance task)
revoke all on function "public"."cleanup_stale_push_tokens"() from public;
grant execute on function "public"."cleanup_stale_push_tokens"() to "service_role";

-- SECURITY: Only service_role can update push token updated_at
revoke all on function "public"."update_push_token_updated_at"() from public;


create policy "Users can delete their own notifications"
on "public"."notifications"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own notifications"
on "public"."notifications"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can delete their own push tokens"
on "public"."push_tokens"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own push tokens"
on "public"."push_tokens"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own push tokens"
on "public"."push_tokens"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own push tokens"
on "public"."push_tokens"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION update_push_token_updated_at();
