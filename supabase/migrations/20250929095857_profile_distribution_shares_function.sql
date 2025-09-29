set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.distribution_shares(profiles)
 RETURNS SETOF distribution_shares
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM distribution_shares WHERE user_id = $1.id
$function$
;


