set check_function_bodies = off;

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.canton_party_verifications(profiles);

-- Recreate with the correct return type
CREATE OR REPLACE FUNCTION public.canton_party_verifications(profiles)
 RETURNS canton_party_verifications  -- Single object, not SETOF
 LANGUAGE sql
 STABLE
AS $function$
SELECT * FROM canton_party_verifications WHERE user_id = $1.id LIMIT 1
$function$;

-- Re-grant permissions
REVOKE ALL ON FUNCTION public.canton_party_verifications(profiles) FROM PUBLIC;
GRANT ALL ON FUNCTION public.canton_party_verifications(profiles) TO "anon";
GRANT ALL ON FUNCTION public.canton_party_verifications(profiles) TO "authenticated";
GRANT ALL ON FUNCTION public.canton_party_verifications(profiles) TO "service_role";
