create table public.chain_addresses (
    address citext PRIMARY KEY CHECK (
        LENGTH(address) = 42
        AND address ~ '^0x[A-Fa-f0-9]{40}$'
    ),
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX chain_addresses_user_id_idx ON public.chain_addresses(user_id);

alter table public.chain_addresses enable row level security;

create policy "Addresses are viewable by users who created them." on chain_addresses for
select using (auth.uid() = user_id);

-- Trigger function to ensure users can only add 1 address for now
CREATE OR REPLACE FUNCTION chain_addresses_after_insert() RETURNS TRIGGER LANGUAGE plpgsql security definer
set search_path = public AS $$ BEGIN -- Ensure users can only insert or update their own tags
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Users can only create addresses for themselves';

END IF;

-- Ensure that a user does not exceed the chain_addresses limit
IF (
    SELECT COUNT(*)
    FROM public.chain_addresses
    WHERE user_id = NEW.user_id
        AND TG_OP = 'INSERT'
) > 1 THEN RAISE EXCEPTION 'User can have at most 1 address';

END IF;

-- Return the new record to be inserted or updated
RETURN NEW;

END;

$$;

-- Assign the trigger function to the tags table to be invoked before inserts or updates
CREATE OR REPLACE TRIGGER trigger_chain_addresses_after_insert
AFTER
INSERT
    OR
UPDATE ON public.chain_addresses FOR EACH ROW EXECUTE FUNCTION chain_addresses_after_insert();
