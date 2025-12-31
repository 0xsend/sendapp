alter table "public"."contact_labels" add constraint "color_format" CHECK (((color IS NULL) OR (color ~ '^#[0-9a-fA-F]{6}$'::text))) not valid;

alter table "public"."contact_labels" validate constraint "color_format";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.contact_search(p_query text DEFAULT NULL::text, p_limit_val integer DEFAULT 50, p_offset_val integer DEFAULT 0, p_favorites_only boolean DEFAULT false, p_label_ids bigint[] DEFAULT NULL::bigint[], p_source_filter contact_source_enum[] DEFAULT NULL::contact_source_enum[], p_include_archived boolean DEFAULT false, p_sort_by_recency_only boolean DEFAULT false)
 RETURNS SETOF contact_search_result
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


