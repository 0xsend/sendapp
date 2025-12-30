drop function if exists "public"."add_contact_by_lookup"(p_lookup_type lookup_type_enum, p_identifier text, p_custom_name text, p_notes text, p_is_favorite boolean);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_contact_by_lookup(p_lookup_type lookup_type_enum, p_identifier text, p_custom_name text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_is_favorite boolean DEFAULT NULL::boolean, p_label_ids bigint[] DEFAULT NULL::bigint[])
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_user_id uuid;
    new_contact_id bigint;
    existing_contact_id bigint;
    existing_archived boolean;
    current_uid uuid;
    label_id bigint;
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
        FOREACH label_id IN ARRAY p_label_ids
        LOOP
            INSERT INTO contact_label_assignments (contact_id, label_id)
            SELECT new_contact_id, label_id
            WHERE EXISTS (
                SELECT 1 FROM contact_labels cl
                WHERE cl.id = label_id AND cl.owner_id = current_uid
            )
            ON CONFLICT (contact_id, label_id) DO NOTHING;
        END LOOP;
    END IF;

    RETURN new_contact_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.contact_by_send_id(p_send_id integer)
 RETURNS contact_search_result
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


