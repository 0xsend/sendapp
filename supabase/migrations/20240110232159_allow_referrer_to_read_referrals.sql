set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.user_referrals_count(user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
begin
return (select count(*) from referrals
where referrer_id=user_id);
end;$function$
;