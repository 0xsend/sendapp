-- remove duplicated foreign key
ALTER TABLE public.tags
DROP CONSTRAINT tags_profile_user_id_fkey;

-- add computed relationship between profiles and tags
CREATE OR REPLACE FUNCTION tags(profiles) RETURNS SETOF tags as $$
    SELECT * FROM tags WHERE user_id = $1.id
$$ STABLE LANGUAGE SQL;