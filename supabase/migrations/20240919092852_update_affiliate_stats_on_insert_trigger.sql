SET check_function_bodies = OFF;

CREATE OR REPLACE FUNCTION public.update_affiliate_stats_on_activity_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
BEGIN
    -- Check if the new activity matches the conditions for incrementing paymaster_tx_count
    IF NEW.event_name = 'send_account_transfers' AND(NEW.data ->> 't' IN('\x592e1224d203be4214b15e205f6081fbbacfcd2d', '\x4c99cdaab0cfe32b4ba77d30342b5c51e0444e5b')) THEN
        -- Insert or update the affiliate_stats record
        INSERT INTO affiliate_stats(user_id, paymaster_tx_count)
            VALUES(NEW.from_user_id, 1)
        ON CONFLICT(user_id)
            DO UPDATE SET
                paymaster_tx_count = affiliate_stats.paymaster_tx_count + 1;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER after_activity_insert_update_affiliate_stats
    AFTER INSERT ON public.activity
    FOR EACH ROW
    EXECUTE FUNCTION public.update_affiliate_stats_on_activity_insert();

