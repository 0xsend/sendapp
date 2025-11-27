set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_tickets_purchased_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    tickets_count numeric;
BEGIN
    tickets_count := calculate_tickets_from_bps_with_fee(NEW.tickets_purchased_total_bps, NEW.block_num);
    NEW.tickets_purchased_count := tickets_count;

    RETURN NEW;
END;
$function$
;


