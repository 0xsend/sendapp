-- Contact Book Schema
-- Tables, constraints, indexes, triggers, functions, RLS, and grants for contact management
-- Note: contact_source_enum and contact_search_result are defined in types.sql

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."contacts_id_seq"
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."contacts_id_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."contact_labels_id_seq"
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."contact_labels_id_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."contact_label_assignments_id_seq"
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."contact_label_assignments_id_seq" OWNER TO "postgres";

-- Tables

-- Main contacts table
CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" bigint NOT NULL DEFAULT nextval('contacts_id_seq'),
    "owner_id" uuid NOT NULL DEFAULT auth.uid(),
    "contact_user_id" uuid,
    "external_address" text,
    "chain_id" text,
    "custom_name" text,
    "notes" text,
    "is_favorite" boolean DEFAULT false NOT NULL,
    "source" "public"."contact_source_enum" DEFAULT 'manual'::"public"."contact_source_enum" NOT NULL,
    "last_interacted_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    -- Generated column for case-insensitive address matching on EVM chains
    "normalized_external_address" text GENERATED ALWAYS AS (
        CASE WHEN chain_id LIKE 'eip155:%' THEN lower(external_address) ELSE external_address END
    ) STORED,
    -- Constraints
    CONSTRAINT "contacts_custom_name_length" CHECK (length(custom_name) <= 80),
    CONSTRAINT "contacts_notes_length" CHECK (length(notes) <= 500),
    -- Must have either contact_user_id or external_address
    CONSTRAINT "contacts_has_identity" CHECK (
        (contact_user_id IS NOT NULL) OR (external_address IS NOT NULL)
    ),
    -- Mutually exclusive: cannot have both
    CONSTRAINT "contacts_identity_exclusive" CHECK (
        NOT (contact_user_id IS NOT NULL AND external_address IS NOT NULL)
    ),
    -- chain_id required iff external_address is present
    CONSTRAINT "contacts_chain_id_iff_external" CHECK (
        (external_address IS NULL) = (chain_id IS NULL)
    ),
    -- source='external' iff external_address is present
    CONSTRAINT "contacts_source_external_iff_external_address" CHECK (
        (source = 'external') = (external_address IS NOT NULL)
    ),
    -- No self-contacts
    CONSTRAINT "contacts_no_self" CHECK (owner_id != contact_user_id),
    -- Chain-specific address validation
    -- EIP-155 (EVM): chain_id like 'eip155:N', address 0x + 40 hex chars
    -- Solana: chain_id like 'solana:N', address 32-44 base58 chars
    -- Canton: chain_id like 'canton:X', address party::hex format
    CONSTRAINT "contacts_valid_chain_address" CHECK (
        external_address IS NULL OR (
            -- EIP-155 validation
            (chain_id ~ '^eip155:\d+$' AND external_address ~ '^0x[a-fA-F0-9]{40}$')
            OR
            -- Solana validation
            (chain_id ~ '^solana:[A-Za-z0-9]+$' AND external_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
            OR
            -- Canton validation
            (chain_id ~ '^canton:[A-Za-z0-9-]+$' AND external_address ~ '^[a-zA-Z0-9-]+::[0-9a-fA-F]{64,}$')
        )
    )
);
ALTER TABLE "public"."contacts" OWNER TO "postgres";

-- Contact labels for organizing contacts
CREATE TABLE IF NOT EXISTS "public"."contact_labels" (
    "id" bigint NOT NULL DEFAULT nextval('contact_labels_id_seq'),
    "owner_id" uuid NOT NULL DEFAULT auth.uid(),
    "name" citext NOT NULL,
    "color" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "contact_labels_name_length" CHECK (length(name::text) >= 1 AND length(name::text) <= 32),
    CONSTRAINT "color_format" CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$')
);
ALTER TABLE "public"."contact_labels" OWNER TO "postgres";

-- Junction table for contact-label assignments
CREATE TABLE IF NOT EXISTS "public"."contact_label_assignments" (
    "id" bigint NOT NULL DEFAULT nextval('contact_label_assignments_id_seq'),
    "contact_id" bigint NOT NULL,
    "label_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "public"."contact_label_assignments" OWNER TO "postgres";

-- Sequence ownership
ALTER SEQUENCE "public"."contacts_id_seq" OWNED BY "public"."contacts"."id";
ALTER SEQUENCE "public"."contact_labels_id_seq" OWNED BY "public"."contact_labels"."id";
ALTER SEQUENCE "public"."contact_label_assignments_id_seq" OWNED BY "public"."contact_label_assignments"."id";

-- Primary Keys
ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_labels"
    ADD CONSTRAINT "contact_labels_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_label_assignments"
    ADD CONSTRAINT "contact_label_assignments_pkey" PRIMARY KEY ("id");

-- Unique Constraints (using partial indexes for proper NULL handling)
-- One contact per (owner, user) for Send users
CREATE UNIQUE INDEX "contacts_owner_user_unique_idx" ON "public"."contacts" ("owner_id", "contact_user_id")
    WHERE contact_user_id IS NOT NULL AND archived_at IS NULL;

-- One contact per (owner, address, chain) for external addresses
CREATE UNIQUE INDEX "contacts_owner_external_unique_idx" ON "public"."contacts" ("owner_id", "normalized_external_address", "chain_id")
    WHERE external_address IS NOT NULL AND archived_at IS NULL;

-- One label name per owner
ALTER TABLE ONLY "public"."contact_labels"
    ADD CONSTRAINT "contact_labels_owner_name_unique" UNIQUE ("owner_id", "name");

-- One assignment per contact-label pair
ALTER TABLE ONLY "public"."contact_label_assignments"
    ADD CONSTRAINT "contact_label_assignments_unique" UNIQUE ("contact_id", "label_id");

-- Indexes for performance
CREATE INDEX "contacts_owner_last_interacted_idx" ON "public"."contacts" ("owner_id", "last_interacted_at" DESC NULLS LAST)
    WHERE archived_at IS NULL;

CREATE INDEX "contacts_owner_favorite_idx" ON "public"."contacts" ("owner_id")
    WHERE is_favorite = true AND archived_at IS NULL;

CREATE INDEX "contacts_owner_contact_idx" ON "public"."contacts" ("owner_id", "contact_user_id")
    WHERE contact_user_id IS NOT NULL;

CREATE INDEX "contacts_owner_external_idx" ON "public"."contacts" ("owner_id", "normalized_external_address", "chain_id")
    WHERE external_address IS NOT NULL;

CREATE INDEX "contacts_owner_active_idx" ON "public"."contacts" ("owner_id")
    WHERE archived_at IS NULL;

CREATE INDEX "contact_labels_owner_idx" ON "public"."contact_labels" ("owner_id");

CREATE INDEX "contact_label_assignments_contact_idx" ON "public"."contact_label_assignments" ("contact_id");
CREATE INDEX "contact_label_assignments_label_idx" ON "public"."contact_label_assignments" ("label_id");

-- Optional: trigram indexes for fuzzy search on custom_name and notes
-- Uncomment if pg_trgm extension is enabled and search performance is needed
-- CREATE INDEX "contacts_custom_name_trgm_idx" ON "public"."contacts" USING gin ("custom_name" gin_trgm_ops);
-- CREATE INDEX "contacts_notes_trgm_idx" ON "public"."contacts" USING gin ("notes" gin_trgm_ops);

-- Foreign Keys
ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contact_labels"
    ADD CONSTRAINT "contact_labels_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contact_label_assignments"
    ADD CONSTRAINT "contact_label_assignments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."contact_label_assignments"
    ADD CONSTRAINT "contact_label_assignments_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."contact_labels"("id") ON DELETE CASCADE;

-- Functions

-- Prevent modification of identity columns after creation
CREATE OR REPLACE FUNCTION "public"."prevent_contact_identity_update"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."prevent_contact_identity_update"() OWNER TO "postgres";

-- Update last_interacted_at when a transfer occurs
CREATE OR REPLACE FUNCTION "public"."update_contact_last_interacted"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."update_contact_last_interacted"() OWNER TO "postgres";

-- Toggle favorite status for a contact
CREATE OR REPLACE FUNCTION "public"."toggle_contact_favorite"(p_contact_id bigint)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."toggle_contact_favorite"("p_contact_id" bigint) OWNER TO "postgres";

-- Add contact for a Send user by lookup (client-facing)
-- Note: This function confirms user existence via success/error, similar to profile_lookup.
-- Rate limiting should be implemented at the API gateway level if abuse is a concern.
-- If the contact was previously archived, this function will unarchive it and update the details.
CREATE OR REPLACE FUNCTION "public"."add_contact_by_lookup"(
    p_lookup_type lookup_type_enum,
    p_identifier text,
    p_custom_name text DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_is_favorite boolean DEFAULT NULL,
    p_label_ids bigint[] DEFAULT NULL
)
    RETURNS bigint
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
DECLARE
    target_user_id uuid;
    new_contact_id bigint;
    existing_contact_id bigint;
    existing_archived boolean;
    current_uid uuid;
    v_label_id bigint;
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

    -- Check for existing contact (both archived and active)
    SELECT id, (archived_at IS NOT NULL)
    INTO existing_contact_id, existing_archived
    FROM contacts
    WHERE owner_id = current_uid
      AND contact_user_id = target_user_id
    LIMIT 1;

    IF existing_contact_id IS NOT NULL THEN
        IF existing_archived THEN
            -- Unarchive the existing contact and update details
            -- Note: Only update is_favorite if explicitly provided (not NULL)
            -- to preserve the original favorite status when re-adding
            UPDATE contacts
            SET archived_at = NULL,
                custom_name = COALESCE(p_custom_name, custom_name),
                notes = COALESCE(p_notes, notes),
                is_favorite = CASE WHEN p_is_favorite IS NOT NULL THEN p_is_favorite ELSE is_favorite END,
                updated_at = now()
            WHERE id = existing_contact_id;
            new_contact_id := existing_contact_id;
        ELSE
            RAISE EXCEPTION 'Contact already exists';
        END IF;
    ELSE
        -- Insert new contact
        INSERT INTO contacts (owner_id, contact_user_id, custom_name, notes, is_favorite, source)
        VALUES (current_uid, target_user_id, p_custom_name, p_notes, COALESCE(p_is_favorite, false), 'manual')
        RETURNING id INTO new_contact_id;
    END IF;

    -- Assign labels if provided
    IF p_label_ids IS NOT NULL AND array_length(p_label_ids, 1) > 0 THEN
        -- First remove existing label assignments for this contact
        DELETE FROM contact_label_assignments WHERE contact_id = new_contact_id;

        -- Then add the new labels (only if they belong to the current user)
        FOREACH v_label_id IN ARRAY p_label_ids
        LOOP
            INSERT INTO contact_label_assignments (contact_id, label_id)
            SELECT new_contact_id, v_label_id
            WHERE EXISTS (
                SELECT 1 FROM contact_labels cl
                WHERE cl.id = v_label_id AND cl.owner_id = current_uid
            )
            ON CONFLICT (contact_id, label_id) DO NOTHING;
        END LOOP;
    END IF;

    RETURN new_contact_id;
END;
$$;
ALTER FUNCTION "public"."add_contact_by_lookup"("p_lookup_type" "public"."lookup_type_enum", "p_identifier" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_label_ids" bigint[]) OWNER TO "postgres";

-- Add contact for a Send user (internal use - service_role only)
CREATE OR REPLACE FUNCTION "public"."add_contact"(
    p_owner_id uuid,
    p_contact_user_id uuid,
    p_custom_name text DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_is_favorite boolean DEFAULT false,
    p_source contact_source_enum DEFAULT 'manual'
)
    RETURNS bigint
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."add_contact"("p_owner_id" uuid, "p_contact_user_id" uuid, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_source" "public"."contact_source_enum") OWNER TO "postgres";

-- Add external contact (non-Send address)
CREATE OR REPLACE FUNCTION "public"."add_external_contact"(
    p_external_address text,
    p_chain_id text,
    p_custom_name text DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_is_favorite boolean DEFAULT false
)
    RETURNS bigint
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."add_external_contact"("p_external_address" text, "p_chain_id" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean) OWNER TO "postgres";

-- Search contacts with filtering and enrichment
CREATE OR REPLACE FUNCTION "public"."contact_search"(
    p_query text DEFAULT NULL,
    p_limit_val integer DEFAULT 50,
    p_offset_val integer DEFAULT 0,
    p_favorites_only boolean DEFAULT false,
    p_label_ids bigint[] DEFAULT NULL,
    p_source_filter contact_source_enum[] DEFAULT NULL,
    p_include_archived boolean DEFAULT false,
    p_sort_by_recency_only boolean DEFAULT false
)
    RETURNS SETOF contact_search_result
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
DECLARE
    current_uid uuid;
    escaped_query text;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    escaped_query := regexp_replace(p_query, '([%_\\])', '\\\1', 'g');

    -- Validate and cap limits
    IF p_limit_val IS NULL OR p_limit_val <= 0 OR p_limit_val > 100 THEN
        p_limit_val := 50;
    END IF;
    IF p_offset_val IS NULL OR p_offset_val < 0 THEN
        p_offset_val := 0;
    END IF;

    -- Return with different ordering based on p_sort_by_recency_only flag
    IF p_sort_by_recency_only THEN
        -- Sort purely by last_interacted_at (for Send page)
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
          AND (
              (p_include_archived AND c.archived_at IS NOT NULL)
              OR (NOT p_include_archived AND c.archived_at IS NULL)
          )
          AND (NOT p_favorites_only OR c.is_favorite = true)
          AND (p_source_filter IS NULL OR c.source = ANY(p_source_filter))
          AND (p_label_ids IS NULL OR EXISTS (
              SELECT 1 FROM contact_label_assignments cla
              WHERE cla.contact_id = c.id AND cla.label_id = ANY(p_label_ids)
          ))
          AND (p_query IS NULL OR p_query = '' OR (
              c.custom_name ILIKE '%' || escaped_query || '%'
              OR c.notes ILIKE '%' || escaped_query || '%'
              OR c.external_address ILIKE '%' || escaped_query || '%'
              OR p.name ILIKE '%' || escaped_query || '%'
              OR EXISTS (
                  SELECT 1 FROM tags t
                  JOIN send_account_tags sat ON sat.tag_id = t.id
                  JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
                  WHERE sa2.user_id = c.contact_user_id
                    AND t.status = 'confirmed'
                    AND t.name::text ILIKE '%' || escaped_query || '%'
              )
          ))
        ORDER BY
            c.last_interacted_at DESC NULLS LAST,
            c.created_at DESC
        LIMIT p_limit_val
        OFFSET p_offset_val;
    ELSE
        -- Default ordering: favorites first, then by recency
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
          AND (
              (p_include_archived AND c.archived_at IS NOT NULL)
              OR (NOT p_include_archived AND c.archived_at IS NULL)
          )
          AND (NOT p_favorites_only OR c.is_favorite = true)
          AND (p_source_filter IS NULL OR c.source = ANY(p_source_filter))
          AND (p_label_ids IS NULL OR EXISTS (
              SELECT 1 FROM contact_label_assignments cla
              WHERE cla.contact_id = c.id AND cla.label_id = ANY(p_label_ids)
          ))
          AND (p_query IS NULL OR p_query = '' OR (
              c.custom_name ILIKE '%' || escaped_query || '%'
              OR c.notes ILIKE '%' || escaped_query || '%'
              OR c.external_address ILIKE '%' || escaped_query || '%'
              OR p.name ILIKE '%' || escaped_query || '%'
              OR EXISTS (
                  SELECT 1 FROM tags t
                  JOIN send_account_tags sat ON sat.tag_id = t.id
                  JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
                  WHERE sa2.user_id = c.contact_user_id
                    AND t.status = 'confirmed'
                    AND t.name::text ILIKE '%' || escaped_query || '%'
              )
          ))
        ORDER BY
            c.is_favorite DESC,
            c.last_interacted_at DESC NULLS LAST,
            c.created_at DESC
        LIMIT p_limit_val
        OFFSET p_offset_val;
    END IF;
END;
$$;
ALTER FUNCTION "public"."contact_search"("p_query" text, "p_limit_val" integer, "p_offset_val" integer, "p_favorites_only" boolean, "p_label_ids" bigint[], "p_source_filter" "public"."contact_source_enum"[], "p_include_archived" boolean, "p_sort_by_recency_only" boolean) OWNER TO "postgres";

-- Sync contacts from activity (backfill from transfer history)
CREATE OR REPLACE FUNCTION "public"."sync_contacts_from_activity"()
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."sync_contacts_from_activity"() OWNER TO "postgres";

-- Sync contacts from referrals (respects sync_referrals_to_contacts preference)
CREATE OR REPLACE FUNCTION "public"."sync_contacts_from_referrals"()
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."sync_contacts_from_referrals"() OWNER TO "postgres";

-- Get favorite contacts (paginated, returns activity_feed_user format)
CREATE OR REPLACE FUNCTION "public"."contact_favorites"(
    p_page_number integer DEFAULT 0,
    p_page_size integer DEFAULT 10
)
    RETURNS SETOF activity_feed_user
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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
$$;
ALTER FUNCTION "public"."contact_favorites"("p_page_number" integer, "p_page_size" integer) OWNER TO "postgres";

-- Get a contact by the recipient's send_id (returns null if not a contact)
CREATE OR REPLACE FUNCTION "public"."contact_by_send_id"(
    p_send_id integer
)
    RETURNS contact_search_result
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
DECLARE
    current_uid uuid;
    result contact_search_result;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT
        c.id::bigint,
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
        p.name::text,
        p.avatar_url::text,
        p.send_id,
        sa.main_tag_id,
        mt.name::text,
        (SELECT array_agg(t.name::text)
         FROM tags t
         JOIN send_account_tags sat ON sat.tag_id = t.id
         JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
         WHERE sa2.user_id = c.contact_user_id AND t.status = 'confirmed'),
        (p.verified_at IS NOT NULL),
        (SELECT array_agg(cla.label_id)
         FROM contact_label_assignments cla
         WHERE cla.contact_id = c.id)
    INTO result
    FROM contacts c
    JOIN profiles p ON p.id = c.contact_user_id
    LEFT JOIN send_accounts sa ON sa.user_id = c.contact_user_id
    LEFT JOIN tags mt ON mt.id = sa.main_tag_id
    WHERE c.owner_id = current_uid
      AND p.send_id = p_send_id
      AND c.archived_at IS NULL
    LIMIT 1;

    RETURN result;
END;
$$;
ALTER FUNCTION "public"."contact_by_send_id"("p_send_id" integer) OWNER TO "postgres";

-- Enforce maximum of 3 labels per contact
CREATE OR REPLACE FUNCTION "public"."check_contact_label_limit"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
BEGIN
    IF (SELECT COUNT(*) FROM contact_label_assignments WHERE contact_id = NEW.contact_id) >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 labels allowed per contact';
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."check_contact_label_limit"() OWNER TO "postgres";

-- Enforce maximum of 3 labels per user (total labels a user can create)
CREATE OR REPLACE FUNCTION "public"."check_contact_labels_total_limit"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $$
BEGIN
    IF (SELECT COUNT(*) FROM contact_labels WHERE owner_id = NEW.owner_id) >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 labels allowed per user';
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."check_contact_labels_total_limit"() OWNER TO "postgres";

-- Triggers

-- Updated_at trigger for contacts
CREATE TRIGGER "contacts_set_updated_at"
    BEFORE UPDATE ON "public"."contacts"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Updated_at trigger for contact_labels
CREATE TRIGGER "contact_labels_set_updated_at"
    BEFORE UPDATE ON "public"."contact_labels"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Prevent identity column updates
CREATE TRIGGER "contacts_prevent_identity_update"
    BEFORE UPDATE ON "public"."contacts"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."prevent_contact_identity_update"();

-- Update last_interacted_at on new activity
CREATE TRIGGER "contacts_update_last_interacted"
    AFTER INSERT ON "public"."activity"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_contact_last_interacted"();

-- Enforce max 3 labels per contact
CREATE TRIGGER "contact_label_assignments_enforce_limit"
    BEFORE INSERT ON "public"."contact_label_assignments"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."check_contact_label_limit"();

-- Enforce max 3 labels per user (total labels a user can create)
CREATE TRIGGER "contact_labels_enforce_total_limit"
    BEFORE INSERT ON "public"."contact_labels"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."check_contact_labels_total_limit"();

-- RLS
ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_labels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_label_assignments" ENABLE ROW LEVEL SECURITY;

-- Policies for contacts table
CREATE POLICY "contacts_select_policy" ON "public"."contacts"
    FOR SELECT TO authenticated
    USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "contacts_insert_policy" ON "public"."contacts"
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "contacts_update_policy" ON "public"."contacts"
    FOR UPDATE TO authenticated
    USING (owner_id = (SELECT auth.uid()))
    WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "contacts_delete_policy" ON "public"."contacts"
    FOR DELETE TO authenticated
    USING (owner_id = (SELECT auth.uid()));

-- Policies for contact_labels table
CREATE POLICY "contact_labels_select_policy" ON "public"."contact_labels"
    FOR SELECT TO authenticated
    USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "contact_labels_insert_policy" ON "public"."contact_labels"
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "contact_labels_update_policy" ON "public"."contact_labels"
    FOR UPDATE TO authenticated
    USING (owner_id = (SELECT auth.uid()))
    WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "contact_labels_delete_policy" ON "public"."contact_labels"
    FOR DELETE TO authenticated
    USING (owner_id = (SELECT auth.uid()));

-- Policies for contact_label_assignments table (junction table)
CREATE POLICY "contact_label_assignments_select_policy" ON "public"."contact_label_assignments"
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id AND c.owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "contact_label_assignments_insert_policy" ON "public"."contact_label_assignments"
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id AND c.owner_id = (SELECT auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM contact_labels cl
            WHERE cl.id = label_id AND cl.owner_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "contact_label_assignments_delete_policy" ON "public"."contact_label_assignments"
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id AND c.owner_id = (SELECT auth.uid())
        )
    );

-- Grants

-- Sequences
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."contact_labels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contact_labels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contact_labels_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."contact_label_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contact_label_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contact_label_assignments_id_seq" TO "service_role";

-- Tables
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";

GRANT ALL ON TABLE "public"."contact_labels" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_labels" TO "service_role";

GRANT ALL ON TABLE "public"."contact_label_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_label_assignments" TO "service_role";

-- Functions
REVOKE ALL ON FUNCTION "public"."prevent_contact_identity_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_contact_identity_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_contact_identity_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_contact_last_interacted"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_contact_last_interacted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_contact_last_interacted"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."toggle_contact_favorite"("p_contact_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."toggle_contact_favorite"("p_contact_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_contact_favorite"("p_contact_id" bigint) TO "service_role";

REVOKE ALL ON FUNCTION "public"."add_contact_by_lookup"("p_lookup_type" "public"."lookup_type_enum", "p_identifier" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_label_ids" bigint[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_contact_by_lookup"("p_lookup_type" "public"."lookup_type_enum", "p_identifier" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_label_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_contact_by_lookup"("p_lookup_type" "public"."lookup_type_enum", "p_identifier" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_label_ids" bigint[]) TO "service_role";

-- add_contact is service_role only (internal function)
REVOKE ALL ON FUNCTION "public"."add_contact"("p_owner_id" uuid, "p_contact_user_id" uuid, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_source" "public"."contact_source_enum") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_contact"("p_owner_id" uuid, "p_contact_user_id" uuid, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean, "p_source" "public"."contact_source_enum") TO "service_role";

REVOKE ALL ON FUNCTION "public"."add_external_contact"("p_external_address" text, "p_chain_id" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_external_contact"("p_external_address" text, "p_chain_id" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_external_contact"("p_external_address" text, "p_chain_id" text, "p_custom_name" text, "p_notes" text, "p_is_favorite" boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."contact_search"("p_query" text, "p_limit_val" integer, "p_offset_val" integer, "p_favorites_only" boolean, "p_label_ids" bigint[], "p_source_filter" "public"."contact_source_enum"[], "p_include_archived" boolean, "p_sort_by_recency_only" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."contact_search"("p_query" text, "p_limit_val" integer, "p_offset_val" integer, "p_favorites_only" boolean, "p_label_ids" bigint[], "p_source_filter" "public"."contact_source_enum"[], "p_include_archived" boolean, "p_sort_by_recency_only" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."contact_search"("p_query" text, "p_limit_val" integer, "p_offset_val" integer, "p_favorites_only" boolean, "p_label_ids" bigint[], "p_source_filter" "public"."contact_source_enum"[], "p_include_archived" boolean, "p_sort_by_recency_only" boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sync_contacts_from_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_contacts_from_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_contacts_from_activity"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sync_contacts_from_referrals"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_contacts_from_referrals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_contacts_from_referrals"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."contact_favorites"("p_page_number" integer, "p_page_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."contact_favorites"("p_page_number" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."contact_favorites"("p_page_number" integer, "p_page_size" integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."contact_by_send_id"("p_send_id" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."contact_by_send_id"("p_send_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."contact_by_send_id"("p_send_id" integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."check_contact_label_limit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_contact_label_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_contact_label_limit"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."check_contact_labels_total_limit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_contact_labels_total_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_contact_labels_total_limit"() TO "service_role";
