create type "public"."contact_source_enum" as enum ('activity', 'manual', 'external', 'referral');

create type "public"."contact_search_result" as ("contact_id" bigint, "owner_id" uuid, "custom_name" text, "notes" text, "is_favorite" boolean, "source" contact_source_enum, "last_interacted_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "archived_at" timestamp with time zone, "external_address" text, "chain_id" text, "profile_name" text, "avatar_url" text, "send_id" integer, "main_tag_id" bigint, "main_tag_name" text, "tags" text[], "is_verified" boolean, "label_ids" bigint[]);

create sequence "public"."contact_label_assignments_id_seq";

create sequence "public"."contact_labels_id_seq";

create sequence "public"."contacts_id_seq";

create table "public"."contact_label_assignments" (
    "id" bigint not null default nextval('contact_label_assignments_id_seq'::regclass),
    "contact_id" bigint not null,
    "label_id" bigint not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."contact_label_assignments" enable row level security;

create table "public"."contact_labels" (
    "id" bigint not null default nextval('contact_labels_id_seq'::regclass),
    "owner_id" uuid not null,
    "name" citext not null,
    "color" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."contact_labels" enable row level security;

create table "public"."contacts" (
    "id" bigint not null default nextval('contacts_id_seq'::regclass),
    "owner_id" uuid not null,
    "contact_user_id" uuid,
    "external_address" text,
    "chain_id" text,
    "custom_name" text,
    "notes" text,
    "is_favorite" boolean not null default false,
    "source" contact_source_enum not null default 'manual'::contact_source_enum,
    "last_interacted_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "normalized_external_address" text generated always as (
CASE
    WHEN (chain_id ~~ 'eip155:%'::text) THEN lower(external_address)
    ELSE external_address
END) stored
);


alter table "public"."contacts" enable row level security;

alter table "public"."profiles" add column "sync_referrals_to_contacts" boolean not null default true;

alter sequence "public"."contact_label_assignments_id_seq" owned by "public"."contact_label_assignments"."id";

alter sequence "public"."contact_labels_id_seq" owned by "public"."contact_labels"."id";

alter sequence "public"."contacts_id_seq" owned by "public"."contacts"."id";

CREATE INDEX contact_label_assignments_contact_idx ON public.contact_label_assignments USING btree (contact_id);

CREATE INDEX contact_label_assignments_label_idx ON public.contact_label_assignments USING btree (label_id);

CREATE UNIQUE INDEX contact_label_assignments_pkey ON public.contact_label_assignments USING btree (id);

CREATE UNIQUE INDEX contact_label_assignments_unique ON public.contact_label_assignments USING btree (contact_id, label_id);

CREATE INDEX contact_labels_owner_idx ON public.contact_labels USING btree (owner_id);

CREATE UNIQUE INDEX contact_labels_owner_name_unique ON public.contact_labels USING btree (owner_id, name);

CREATE UNIQUE INDEX contact_labels_pkey ON public.contact_labels USING btree (id);

CREATE INDEX contacts_owner_active_idx ON public.contacts USING btree (owner_id) WHERE (archived_at IS NULL);

CREATE INDEX contacts_owner_contact_idx ON public.contacts USING btree (owner_id, contact_user_id) WHERE (contact_user_id IS NOT NULL);

CREATE INDEX contacts_owner_external_idx ON public.contacts USING btree (owner_id, normalized_external_address, chain_id) WHERE (external_address IS NOT NULL);

CREATE UNIQUE INDEX contacts_owner_external_unique_idx ON public.contacts USING btree (owner_id, normalized_external_address, chain_id) WHERE ((external_address IS NOT NULL) AND (archived_at IS NULL));

CREATE INDEX contacts_owner_favorite_idx ON public.contacts USING btree (owner_id) WHERE ((is_favorite = true) AND (archived_at IS NULL));

CREATE INDEX contacts_owner_last_interacted_idx ON public.contacts USING btree (owner_id, last_interacted_at DESC NULLS LAST) WHERE (archived_at IS NULL);

CREATE UNIQUE INDEX contacts_owner_user_unique_idx ON public.contacts USING btree (owner_id, contact_user_id) WHERE ((contact_user_id IS NOT NULL) AND (archived_at IS NULL));

CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id);

alter table "public"."contact_label_assignments" add constraint "contact_label_assignments_pkey" PRIMARY KEY using index "contact_label_assignments_pkey";

alter table "public"."contact_labels" add constraint "contact_labels_pkey" PRIMARY KEY using index "contact_labels_pkey";

alter table "public"."contacts" add constraint "contacts_pkey" PRIMARY KEY using index "contacts_pkey";

alter table "public"."contact_label_assignments" add constraint "contact_label_assignments_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE not valid;

alter table "public"."contact_label_assignments" validate constraint "contact_label_assignments_contact_id_fkey";

alter table "public"."contact_label_assignments" add constraint "contact_label_assignments_label_id_fkey" FOREIGN KEY (label_id) REFERENCES contact_labels(id) ON DELETE CASCADE not valid;

alter table "public"."contact_label_assignments" validate constraint "contact_label_assignments_label_id_fkey";

alter table "public"."contact_label_assignments" add constraint "contact_label_assignments_unique" UNIQUE using index "contact_label_assignments_unique";

alter table "public"."contact_labels" add constraint "contact_labels_name_length" CHECK (((length((name)::text) >= 1) AND (length((name)::text) <= 32))) not valid;

alter table "public"."contact_labels" validate constraint "contact_labels_name_length";

alter table "public"."contact_labels" add constraint "contact_labels_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."contact_labels" validate constraint "contact_labels_owner_id_fkey";

alter table "public"."contact_labels" add constraint "contact_labels_owner_name_unique" UNIQUE using index "contact_labels_owner_name_unique";

alter table "public"."contacts" add constraint "contacts_chain_id_iff_external" CHECK (((external_address IS NULL) = (chain_id IS NULL))) not valid;

alter table "public"."contacts" validate constraint "contacts_chain_id_iff_external";

alter table "public"."contacts" add constraint "contacts_contact_user_id_fkey" FOREIGN KEY (contact_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."contacts" validate constraint "contacts_contact_user_id_fkey";

alter table "public"."contacts" add constraint "contacts_custom_name_length" CHECK ((length(custom_name) <= 80)) not valid;

alter table "public"."contacts" validate constraint "contacts_custom_name_length";

alter table "public"."contacts" add constraint "contacts_has_identity" CHECK (((contact_user_id IS NOT NULL) OR (external_address IS NOT NULL))) not valid;

alter table "public"."contacts" validate constraint "contacts_has_identity";

alter table "public"."contacts" add constraint "contacts_identity_exclusive" CHECK ((NOT ((contact_user_id IS NOT NULL) AND (external_address IS NOT NULL)))) not valid;

alter table "public"."contacts" validate constraint "contacts_identity_exclusive";

alter table "public"."contacts" add constraint "contacts_no_self" CHECK ((owner_id <> contact_user_id)) not valid;

alter table "public"."contacts" validate constraint "contacts_no_self";

alter table "public"."contacts" add constraint "contacts_notes_length" CHECK ((length(notes) <= 500)) not valid;

alter table "public"."contacts" validate constraint "contacts_notes_length";

alter table "public"."contacts" add constraint "contacts_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."contacts" validate constraint "contacts_owner_id_fkey";

alter table "public"."contacts" add constraint "contacts_source_external_iff_external_address" CHECK (((source = 'external'::contact_source_enum) = (external_address IS NOT NULL))) not valid;

alter table "public"."contacts" validate constraint "contacts_source_external_iff_external_address";

alter table "public"."contacts" add constraint "contacts_valid_chain_address" CHECK (((external_address IS NULL) OR (((chain_id ~ '^eip155:\d+$'::text) AND (external_address ~ '^0x[a-fA-F0-9]{40}$'::text)) OR ((chain_id ~ '^solana:[A-Za-z0-9]+$'::text) AND (external_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'::text)) OR ((chain_id ~ '^canton:[A-Za-z0-9-]+$'::text) AND (external_address ~ '^[a-zA-Z0-9-]+::[0-9a-fA-F]{64,}$'::text))))) not valid;

alter table "public"."contacts" validate constraint "contacts_valid_chain_address";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_contact(p_owner_id uuid, p_contact_user_id uuid, p_custom_name text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_is_favorite boolean DEFAULT false, p_source contact_source_enum DEFAULT 'manual'::contact_source_enum)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_contact_id bigint;
BEGIN
    IF p_owner_id IS NULL OR p_contact_user_id IS NULL THEN
        RAISE EXCEPTION 'owner_id and contact_user_id are required';
    END IF;

    IF p_owner_id = p_contact_user_id THEN
        RAISE EXCEPTION 'Cannot add yourself as a contact';
    END IF;

    -- Insert or update on conflict (handles archived contacts by excluding them from unique constraint)
    INSERT INTO contacts (owner_id, contact_user_id, custom_name, notes, is_favorite, source)
    VALUES (p_owner_id, p_contact_user_id, p_custom_name, p_notes, COALESCE(p_is_favorite, false), COALESCE(p_source, 'manual'))
    ON CONFLICT (owner_id, contact_user_id) WHERE contact_user_id IS NOT NULL AND archived_at IS NULL
    DO UPDATE SET
        custom_name = COALESCE(EXCLUDED.custom_name, contacts.custom_name),
        notes = COALESCE(EXCLUDED.notes, contacts.notes),
        is_favorite = COALESCE(EXCLUDED.is_favorite, contacts.is_favorite),
        updated_at = now()
    RETURNING id INTO new_contact_id;

    RETURN new_contact_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_contact_by_lookup(p_lookup_type lookup_type_enum, p_identifier text, p_custom_name text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_is_favorite boolean DEFAULT false)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_user_id uuid;
    new_contact_id bigint;
    current_uid uuid;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_identifier IS NULL OR p_identifier = '' THEN
        RAISE EXCEPTION 'identifier cannot be null or empty';
    END IF;

    -- Look up the target user directly based on lookup type
    -- Note: profile_lookup returns id only for current user, so we query directly
    CASE p_lookup_type
        WHEN 'tag' THEN
            -- Look up by sendtag name
            SELECT t.user_id INTO target_user_id
            FROM tags t
            WHERE t.name = p_identifier::citext
              AND t.status = 'confirmed'
            LIMIT 1;
        WHEN 'sendid' THEN
            -- Look up by send_id (numeric)
            -- Guard against non-numeric input
            IF p_identifier !~ '^\d+$' THEN
                RAISE EXCEPTION 'Invalid send_id format: %', p_identifier;
            END IF;
            SELECT p.id INTO target_user_id
            FROM profiles p
            WHERE p.send_id = p_identifier::integer
            LIMIT 1;
        WHEN 'address' THEN
            -- Look up by send account address
            SELECT sa.user_id INTO target_user_id
            FROM send_accounts sa
            WHERE lower(sa.address) = lower(p_identifier)
            LIMIT 1;
        WHEN 'refcode' THEN
            -- Look up by referral code
            SELECT p.id INTO target_user_id
            FROM profiles p
            WHERE p.referral_code = p_identifier
            LIMIT 1;
        ELSE
            RAISE EXCEPTION 'Unsupported lookup type: %', p_lookup_type;
    END CASE;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for identifier: %', p_identifier;
    END IF;

    IF target_user_id = current_uid THEN
        RAISE EXCEPTION 'Cannot add yourself as a contact';
    END IF;

    -- Check for existing contact
    IF EXISTS (
        SELECT 1 FROM contacts
        WHERE owner_id = current_uid
          AND contact_user_id = target_user_id
          AND archived_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Contact already exists';
    END IF;

    -- Insert the contact
    INSERT INTO contacts (owner_id, contact_user_id, custom_name, notes, is_favorite, source)
    VALUES (current_uid, target_user_id, p_custom_name, p_notes, COALESCE(p_is_favorite, false), 'manual')
    RETURNING id INTO new_contact_id;

    RETURN new_contact_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_external_contact(p_external_address text, p_chain_id text, p_custom_name text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_is_favorite boolean DEFAULT false)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_contact_id bigint;
    current_uid uuid;
    normalized_addr text;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_external_address IS NULL OR p_chain_id IS NULL THEN
        RAISE EXCEPTION 'external_address and chain_id are required';
    END IF;

    -- Normalize address for EVM chains
    normalized_addr := CASE WHEN p_chain_id LIKE 'eip155:%' THEN lower(p_external_address) ELSE p_external_address END;

    -- Check for existing contact
    IF EXISTS (
        SELECT 1 FROM contacts
        WHERE owner_id = current_uid
          AND normalized_external_address = normalized_addr
          AND chain_id = p_chain_id
          AND archived_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Contact already exists';
    END IF;

    -- Insert the contact
    INSERT INTO contacts (owner_id, external_address, chain_id, custom_name, notes, is_favorite, source)
    VALUES (current_uid, p_external_address, p_chain_id, p_custom_name, p_notes, COALESCE(p_is_favorite, false), 'external')
    RETURNING id INTO new_contact_id;

    RETURN new_contact_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.contact_favorites(p_page_number integer DEFAULT 0, p_page_size integer DEFAULT 10)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_uid uuid;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate and cap page_size
    IF p_page_size > 50 THEN
        p_page_size := 50;
    END IF;
    IF p_page_size < 1 THEN
        p_page_size := 1;
    END IF;
    IF p_page_number < 0 THEN
        p_page_number := 0;
    END IF;

    RETURN QUERY
    SELECT (
        NULL::uuid,  -- id hidden for privacy
        p.name,
        p.avatar_url,
        p.send_id,
        sa.main_tag_id,
        mt.name::text,
        (SELECT array_agg(t.name::text)
         FROM tags t
         JOIN send_account_tags sat ON sat.tag_id = t.id
         JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
         WHERE sa2.user_id = c.contact_user_id AND t.status = 'confirmed'),
        (p.verified_at IS NOT NULL)
    )::activity_feed_user
    FROM contacts c
    JOIN profiles p ON p.id = c.contact_user_id
    LEFT JOIN send_accounts sa ON sa.user_id = c.contact_user_id
    LEFT JOIN tags mt ON mt.id = sa.main_tag_id
    WHERE c.owner_id = current_uid
      AND c.is_favorite = true
      AND c.archived_at IS NULL
      AND c.contact_user_id IS NOT NULL  -- Only Send users have profiles
    ORDER BY c.last_interacted_at DESC NULLS LAST, c.created_at DESC
    LIMIT p_page_size
    OFFSET p_page_number * p_page_size;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.contact_search(p_query text DEFAULT NULL::text, p_limit_val integer DEFAULT 50, p_offset_val integer DEFAULT 0, p_favorites_only boolean DEFAULT false, p_label_ids bigint[] DEFAULT NULL::bigint[], p_source_filter contact_source_enum[] DEFAULT NULL::contact_source_enum[])
 RETURNS SETOF contact_search_result
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_uid uuid;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate and cap limits
    IF p_limit_val IS NULL OR p_limit_val <= 0 OR p_limit_val > 100 THEN
        p_limit_val := 50;
    END IF;
    IF p_offset_val IS NULL OR p_offset_val < 0 THEN
        p_offset_val := 0;
    END IF;

    RETURN QUERY
    SELECT
        c.id::bigint AS contact_id,
        c.owner_id,
        c.custom_name,
        c.notes,
        c.is_favorite,
        c.source,
        c.last_interacted_at,
        c.created_at,
        c.updated_at,
        c.archived_at,
        c.external_address,
        c.chain_id,
        p.name::text AS profile_name,
        p.avatar_url::text,
        p.send_id,
        sa.main_tag_id,
        mt.name::text AS main_tag_name,
        (SELECT array_agg(t.name::text)
         FROM tags t
         JOIN send_account_tags sat ON sat.tag_id = t.id
         JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
         WHERE sa2.user_id = c.contact_user_id AND t.status = 'confirmed') AS tags,
        (p.verified_at IS NOT NULL) AS is_verified,
        (SELECT array_agg(cla.label_id)
         FROM contact_label_assignments cla
         WHERE cla.contact_id = c.id) AS label_ids
    FROM contacts c
    LEFT JOIN profiles p ON p.id = c.contact_user_id
    LEFT JOIN send_accounts sa ON sa.user_id = c.contact_user_id
    LEFT JOIN tags mt ON mt.id = sa.main_tag_id
    WHERE c.owner_id = current_uid
      AND c.archived_at IS NULL
      -- Favorites filter
      AND (NOT p_favorites_only OR c.is_favorite = true)
      -- Source filter
      AND (p_source_filter IS NULL OR c.source = ANY(p_source_filter))
      -- Label filter: contact must have at least one of the specified labels
      AND (p_label_ids IS NULL OR EXISTS (
          SELECT 1 FROM contact_label_assignments cla
          WHERE cla.contact_id = c.id AND cla.label_id = ANY(p_label_ids)
      ))
      -- Text search filter
      AND (p_query IS NULL OR p_query = '' OR (
          c.custom_name ILIKE '%' || p_query || '%'
          OR c.notes ILIKE '%' || p_query || '%'
          OR c.external_address ILIKE '%' || p_query || '%'
          OR p.name ILIKE '%' || p_query || '%'
          OR EXISTS (
              SELECT 1 FROM tags t
              JOIN send_account_tags sat ON sat.tag_id = t.id
              JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
              WHERE sa2.user_id = c.contact_user_id
                AND t.status = 'confirmed'
                AND t.name::text ILIKE '%' || p_query || '%'
          )
      ))
    ORDER BY
        c.is_favorite DESC,
        c.last_interacted_at DESC NULLS LAST,
        c.created_at DESC
    LIMIT p_limit_val
    OFFSET p_offset_val;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_contact_identity_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.contact_user_id IS DISTINCT FROM NEW.contact_user_id THEN
        RAISE EXCEPTION 'contact_user_id cannot be changed after creation';
    END IF;
    IF OLD.external_address IS DISTINCT FROM NEW.external_address THEN
        RAISE EXCEPTION 'external_address cannot be changed after creation';
    END IF;
    IF OLD.chain_id IS DISTINCT FROM NEW.chain_id THEN
        RAISE EXCEPTION 'chain_id cannot be changed after creation';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_contacts_from_activity()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_uid uuid;
    inserted_count integer := 0;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Insert contacts for all unique counterparties from activity
    WITH counterparties AS (
        SELECT DISTINCT
            CASE
                WHEN a.from_user_id = current_uid THEN a.to_user_id
                ELSE a.from_user_id
            END AS counterparty_id,
            MAX(a.created_at) AS last_activity
        FROM activity a
        WHERE a.event_name IN ('send_account_transfers', 'send_account_receives')
          AND (a.from_user_id = current_uid OR a.to_user_id = current_uid)
          AND a.from_user_id IS NOT NULL
          AND a.to_user_id IS NOT NULL
          AND a.from_user_id != a.to_user_id
        GROUP BY 1
    )
    INSERT INTO contacts (owner_id, contact_user_id, source, last_interacted_at)
    SELECT
        current_uid,
        cp.counterparty_id,
        'activity'::contact_source_enum,
        cp.last_activity
    FROM counterparties cp
    WHERE cp.counterparty_id IS NOT NULL
      AND cp.counterparty_id != current_uid
      AND NOT EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.owner_id = current_uid
            AND c.contact_user_id = cp.counterparty_id
            AND c.archived_at IS NULL
      );

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_contacts_from_referrals()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_uid uuid;
    inserted_count integer := 0;
    should_sync boolean;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check user preference
    SELECT sync_referrals_to_contacts INTO should_sync
    FROM profiles
    WHERE id = current_uid;

    IF NOT COALESCE(should_sync, true) THEN
        RETURN 0;
    END IF;

    -- Insert contacts for all referrals (both directions)
    WITH referral_users AS (
        -- People I referred
        SELECT referred_id AS user_id, created_at FROM referrals WHERE referrer_id = current_uid
        UNION
        -- Person who referred me
        SELECT referrer_id AS user_id, created_at FROM referrals WHERE referred_id = current_uid
    )
    INSERT INTO contacts (owner_id, contact_user_id, source, created_at)
    SELECT
        current_uid,
        ru.user_id,
        'referral'::contact_source_enum,
        ru.created_at
    FROM referral_users ru
    WHERE ru.user_id IS NOT NULL
      AND ru.user_id != current_uid
      AND NOT EXISTS (
          SELECT 1 FROM contacts c
          WHERE c.owner_id = current_uid
            AND c.contact_user_id = ru.user_id
            AND c.archived_at IS NULL
      );

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_contact_favorite(p_contact_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_favorite boolean;
BEGIN
    UPDATE contacts
    SET is_favorite = NOT is_favorite,
        updated_at = now()
    WHERE id = p_contact_id
      AND owner_id = (SELECT auth.uid())
      AND archived_at IS NULL
    RETURNING is_favorite INTO new_favorite;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    RETURN new_favorite;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_contact_last_interacted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only process transfer events
    IF NEW.event_name NOT IN ('send_account_transfers', 'send_account_receives') THEN
        RETURN NEW;
    END IF;

    -- Update contacts where the current user sent to or received from the counterparty
    -- For transfers: from_user_id is sender, to_user_id is recipient
    -- Update contact record where owner is one party and contact_user_id is the other

    -- Case 1: Current user (from_user_id) sent to contact_user_id (to_user_id)
    IF NEW.from_user_id IS NOT NULL AND NEW.to_user_id IS NOT NULL THEN
        UPDATE contacts
        SET last_interacted_at = NEW.created_at
        WHERE (
            (owner_id = NEW.from_user_id AND contact_user_id = NEW.to_user_id)
            OR
            (owner_id = NEW.to_user_id AND contact_user_id = NEW.from_user_id)
        )
        AND archived_at IS NULL;
    END IF;

    RETURN NEW;
END;
$function$
;

grant delete on table "public"."contact_label_assignments" to "anon";

grant insert on table "public"."contact_label_assignments" to "anon";

grant references on table "public"."contact_label_assignments" to "anon";

grant select on table "public"."contact_label_assignments" to "anon";

grant trigger on table "public"."contact_label_assignments" to "anon";

grant truncate on table "public"."contact_label_assignments" to "anon";

grant update on table "public"."contact_label_assignments" to "anon";

grant delete on table "public"."contact_label_assignments" to "authenticated";

grant insert on table "public"."contact_label_assignments" to "authenticated";

grant references on table "public"."contact_label_assignments" to "authenticated";

grant select on table "public"."contact_label_assignments" to "authenticated";

grant trigger on table "public"."contact_label_assignments" to "authenticated";

grant truncate on table "public"."contact_label_assignments" to "authenticated";

grant update on table "public"."contact_label_assignments" to "authenticated";

grant delete on table "public"."contact_label_assignments" to "service_role";

grant insert on table "public"."contact_label_assignments" to "service_role";

grant references on table "public"."contact_label_assignments" to "service_role";

grant select on table "public"."contact_label_assignments" to "service_role";

grant trigger on table "public"."contact_label_assignments" to "service_role";

grant truncate on table "public"."contact_label_assignments" to "service_role";

grant update on table "public"."contact_label_assignments" to "service_role";

grant delete on table "public"."contact_labels" to "anon";

grant insert on table "public"."contact_labels" to "anon";

grant references on table "public"."contact_labels" to "anon";

grant select on table "public"."contact_labels" to "anon";

grant trigger on table "public"."contact_labels" to "anon";

grant truncate on table "public"."contact_labels" to "anon";

grant update on table "public"."contact_labels" to "anon";

grant delete on table "public"."contact_labels" to "authenticated";

grant insert on table "public"."contact_labels" to "authenticated";

grant references on table "public"."contact_labels" to "authenticated";

grant select on table "public"."contact_labels" to "authenticated";

grant trigger on table "public"."contact_labels" to "authenticated";

grant truncate on table "public"."contact_labels" to "authenticated";

grant update on table "public"."contact_labels" to "authenticated";

grant delete on table "public"."contact_labels" to "service_role";

grant insert on table "public"."contact_labels" to "service_role";

grant references on table "public"."contact_labels" to "service_role";

grant select on table "public"."contact_labels" to "service_role";

grant trigger on table "public"."contact_labels" to "service_role";

grant truncate on table "public"."contact_labels" to "service_role";

grant update on table "public"."contact_labels" to "service_role";

grant delete on table "public"."contacts" to "anon";

grant insert on table "public"."contacts" to "anon";

grant references on table "public"."contacts" to "anon";

grant select on table "public"."contacts" to "anon";

grant trigger on table "public"."contacts" to "anon";

grant truncate on table "public"."contacts" to "anon";

grant update on table "public"."contacts" to "anon";

grant delete on table "public"."contacts" to "authenticated";

grant insert on table "public"."contacts" to "authenticated";

grant references on table "public"."contacts" to "authenticated";

grant select on table "public"."contacts" to "authenticated";

grant trigger on table "public"."contacts" to "authenticated";

grant truncate on table "public"."contacts" to "authenticated";

grant update on table "public"."contacts" to "authenticated";

grant delete on table "public"."contacts" to "service_role";

grant insert on table "public"."contacts" to "service_role";

grant references on table "public"."contacts" to "service_role";

grant select on table "public"."contacts" to "service_role";

grant trigger on table "public"."contacts" to "service_role";

grant truncate on table "public"."contacts" to "service_role";

grant update on table "public"."contacts" to "service_role";

create policy "contact_label_assignments_delete_policy"
on "public"."contact_label_assignments"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_label_assignments.contact_id) AND (c.owner_id = ( SELECT auth.uid() AS uid))))));


create policy "contact_label_assignments_insert_policy"
on "public"."contact_label_assignments"
as permissive
for insert
to authenticated
with check (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_label_assignments.contact_id) AND (c.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM contact_labels cl
  WHERE ((cl.id = contact_label_assignments.label_id) AND (cl.owner_id = ( SELECT auth.uid() AS uid)))))));


create policy "contact_label_assignments_select_policy"
on "public"."contact_label_assignments"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_label_assignments.contact_id) AND (c.owner_id = ( SELECT auth.uid() AS uid))))));


create policy "contact_labels_delete_policy"
on "public"."contact_labels"
as permissive
for delete
to authenticated
using ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contact_labels_insert_policy"
on "public"."contact_labels"
as permissive
for insert
to authenticated
with check ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contact_labels_select_policy"
on "public"."contact_labels"
as permissive
for select
to authenticated
using ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contact_labels_update_policy"
on "public"."contact_labels"
as permissive
for update
to authenticated
using ((owner_id = ( SELECT auth.uid() AS uid)))
with check ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contacts_delete_policy"
on "public"."contacts"
as permissive
for delete
to authenticated
using ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contacts_insert_policy"
on "public"."contacts"
as permissive
for insert
to authenticated
with check ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contacts_select_policy"
on "public"."contacts"
as permissive
for select
to authenticated
using ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "contacts_update_policy"
on "public"."contacts"
as permissive
for update
to authenticated
using ((owner_id = ( SELECT auth.uid() AS uid)))
with check ((owner_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER contacts_update_last_interacted AFTER INSERT ON public.activity FOR EACH ROW EXECUTE FUNCTION update_contact_last_interacted();

CREATE TRIGGER contact_labels_set_updated_at BEFORE UPDATE ON public.contact_labels FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER contacts_prevent_identity_update BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION prevent_contact_identity_update();

CREATE TRIGGER contacts_set_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();


