DROP FUNCTION IF EXISTS public.profile_lookup(lookup_type_enum, text);

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
    RETURNS TABLE(
        id uuid,
        avatar_url text,
        name text,
        about text,
        refcode text,
        x_username text,
        tag citext,
        address citext,
        chain_id integer,
        is_public boolean,
        sendid integer,
        all_tags text[],
        main_tag_id bigint,
        main_tag_name citext)
    LANGUAGE plpgsql
    IMMUTABLE
    SECURITY DEFINER
    AS $$
BEGIN
    IF identifier IS NULL OR identifier = '' THEN
        RAISE EXCEPTION 'identifier cannot be null or empty';
    END IF;
    IF lookup_type IS NULL THEN
        RAISE EXCEPTION 'lookup_type cannot be null';
    END IF;
    RETURN query WITH profile_data AS(
        SELECT
            p.id AS profile_id,
            p.avatar_url,
            p.name,
            p.about,
            p.referral_code,
            p.x_username,
            t.name AS tag_name,
            sa.address,
            sa.chain_id,
            p.is_public,
            p.send_id,
            sa.main_tag_id,
(
                SELECT
                    mt.name
                FROM
                    tags mt
                WHERE
                    mt.id = sa.main_tag_id
                LIMIT 1) AS main_tag_name,
(
            SELECT
                array_agg(DISTINCT t2.name::text)
            FROM
                tags t2
                JOIN send_account_tags sat ON sat.tag_id = t2.id
                JOIN send_accounts sa2 ON sa2.id = sat.send_account_id
            WHERE
                sa2.user_id = p.id
                AND t2.status = 'confirmed'::tag_status) AS all_tags
    FROM
        profiles p
        JOIN auth.users a ON a.id = p.id
        LEFT JOIN send_accounts sa ON sa.user_id = p.id
        LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
        LEFT JOIN tags t ON t.id = sat.tag_id
            AND t.status = 'confirmed'::tag_status
    WHERE((lookup_type = 'sendid'
            AND p.send_id::text = identifier)
        OR(lookup_type = 'tag'
            AND lower(t.name) = lower(identifier::citext))
        OR(lookup_type = 'refcode'
            AND p.referral_code = identifier)
        OR(lookup_type = 'address'
            AND sa.address = identifier)
        OR(p.is_public
            AND lookup_type = 'phone'
            AND a.phone::text = identifier))
        AND(p.is_public
            OR auth.uid() IS NOT NULL
            OR current_setting('role')::text = 'service_role')
    LIMIT 1
)
SELECT
    CASE WHEN pd.profile_id = auth.uid() THEN
        pd.profile_id
    END AS id,
    pd.avatar_url::text AS avatar_url,
    pd.name::text AS name,
    pd.about::text AS about,
    pd.referral_code AS refcode,
    pd.x_username AS x_username,
    pd.tag_name AS tag,
    pd.address AS address,
    pd.chain_id AS chain_id,
    CASE WHEN current_setting('role')::text = 'service_role' THEN
        pd.is_public
    WHEN pd.is_public THEN
        TRUE
    ELSE
        FALSE
    END AS is_public,
    pd.send_id AS sendid,
    pd.all_tags,
    pd.main_tag_id,
    pd.main_tag_name
FROM
    profile_data pd;
END;
$$;

