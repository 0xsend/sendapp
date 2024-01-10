set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.user_referrals_count()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$begin
return (select count(*) from referrals
where referrer_id=auth.uid());
end;$function$
;

create policy "Allow referrer to read referrals"
on "public"."referrals"
as permissive
for select
to public
using ((auth.uid() = referrer_id));



