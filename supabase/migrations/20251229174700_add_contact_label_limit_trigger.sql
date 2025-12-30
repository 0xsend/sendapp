set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_contact_label_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF (SELECT COUNT(*) FROM contact_label_assignments WHERE contact_id = NEW.contact_id) >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 labels allowed per contact';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE TRIGGER contact_label_assignments_enforce_limit BEFORE INSERT ON public.contact_label_assignments FOR EACH ROW EXECUTE FUNCTION check_contact_label_limit();


