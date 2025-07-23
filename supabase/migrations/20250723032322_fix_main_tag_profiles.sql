set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.main_tag(profiles)
 RETURNS tags
 LANGUAGE sql
 STABLE
AS $function$
    SELECT t.* FROM tags t
    LEFT JOIN send_accounts sa ON sa.user_id = $1.id
    LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
    WHERE sat.tag_id = sa.main_tag_id
    AND t.id = sat.tag_id
    LIMIT 1
$function$
;


