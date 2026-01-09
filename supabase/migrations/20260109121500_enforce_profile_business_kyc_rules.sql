-- Enforce profile type changes based on KYC progress

CREATE OR REPLACE FUNCTION public.enforce_profile_business_kyc_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_business IS NOT DISTINCT FROM OLD.is_business THEN
    RETURN NEW;
  END IF;

  -- Once a profile is business, it cannot switch back to personal
  IF OLD.is_business = true AND NEW.is_business = false THEN
    RAISE EXCEPTION 'Business profiles cannot switch back to personal';
  END IF;

  -- Block any profile type change after KYC completion
  IF EXISTS (
    SELECT 1
    FROM public.bridge_customers bc
    WHERE bc.user_id = NEW.id
      AND bc.kyc_status IN ('approved', 'rejected', 'paused', 'offboarded')
  ) THEN
    RAISE EXCEPTION 'Profile type cannot be changed after KYC completion';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_business_kyc ON public.profiles;

CREATE TRIGGER profiles_enforce_business_kyc
BEFORE UPDATE OF is_business ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_business_kyc_rules();
