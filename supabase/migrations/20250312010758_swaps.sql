CREATE OR REPLACE FUNCTION before_activity_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS
$$
DECLARE
    _paymaster CITEXT := '\x592e1224d203be4214b15e205f6081fbbacfcd2d';
    _router CITEXT := '\x6131b5fae19ea4f9d964eac0408e4408b66337b5';
BEGIN
    -- if new row is not send_account_transfers, insert it normally
    IF NOT (NEW.event_name = 'send_account_transfers' OR NEW.event_name = 'send_account_receives') THEN
        RAISE WARNING 'MY LOG: new row is not send_account_transfers nor send_account_receives, inserting normally';
        RETURN NEW;
    END IF;

    -- if new row is paymaster transfer, insert it normally
    IF NEW.data->>'f' = _paymaster OR NEW.data->>'t' = _paymaster THEN
        RAISE WARNING 'MY LOG: new row is paymaster transfer, inserting normally';
        RETURN NEW;
    END IF;

    -- if new row is router deposit delete all rows with same tx_hash that are not paymaster rows, these are liquidity pools withdrawals
    IF NEW.data->>'f' = _router OR NEW.data->>'sender' = _router THEN
        RAISE WARNING 'MY LOG: new row is router deposit, inserting normally and deleting all rows with same tx_hash that are not paymaster rows';

        DELETE FROM activity
        WHERE data->>'tx_hash' = NEW.data->>'tx_hash'
        AND data->>'f' <> _paymaster
        AND data->>'t' <> _paymaster;

        RAISE WARNING 'MY LOG: deleted all not paymaster rows';
        RAISE WARNING 'MY LOG: inserting router deposit row';

        -- if new row was eth receive from router, adjust fields
        IF NEW.event_name = 'send_account_receives' THEN
            NEW.data := jsonb_set(NEW.data, ARRAY['f'], NEW.data->'sender', true);
            NEW.data := jsonb_set(NEW.data, ARRAY['v'], NEW.data->'value', true);
            NEW.data := jsonb_set(NEW.data, ARRAY['log_addr'], jsonb('"eth"'), true);
            NEW.data := NEW.data - 'sender' - 'value';
        END IF;

        -- if new rows was erc20 token transfer remove not needed fields
        IF NEW.event_name = 'send_account_transfers' THEN
            NEW.data := NEW.data - 't';
        END IF;

        -- change event name to send_swap to handle it properly in ui
        NEW.event_name := 'send_swap';

        RETURN NEW;
    END IF;

    -- if new row has the same tx_hash as already existing router deposit row, it's liquidity pool withdrawal, don't insert it
    IF EXISTS (
            SELECT 1 FROM activity
            WHERE data->>'tx_hash' = NEW.data->>'tx_hash'
            AND data->>'f' = _router
        ) THEN
        RAISE WARNING 'MY LOG: new row is LP withdrawal, skipping';

        RETURN NULL;
    END IF;

    RAISE WARNING 'MY LOG: new row is not paymaster row or cannot tell if is swap related at this moment, insert normally';
    -- new row is not paymaster row or cannot tell if is swap related at this moment, insert normally
    RETURN NEW;
END;
$$;

CREATE TRIGGER before_activity_insert
BEFORE INSERT
ON activity
FOR EACH ROW
EXECUTE FUNCTION before_activity_insert();