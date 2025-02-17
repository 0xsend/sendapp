-- Core schema changes
CREATE TABLE IF NOT EXISTS send_account_tags(
  id serial PRIMARY KEY,
  send_account_id uuid NOT NULL REFERENCES send_accounts(id) ON DELETE CASCADE,
  tag_id bigint NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

ALTER TABLE send_accounts
  ADD COLUMN IF NOT EXISTS main_tag_id bigint REFERENCES tags(id);

-- Add indexes
CREATE INDEX idx_send_account_tags_tag_id ON send_account_tags(tag_id);

CREATE INDEX idx_send_account_tags_send_account_id ON send_account_tags(send_account_id);

-- Populate new tables and update relationships
INSERT INTO send_account_tags(send_account_id, tag_id)
SELECT
  sa.id,
  t.id
FROM
  tags t
  JOIN send_accounts sa ON t.user_id = sa.user_id
WHERE
  t.status = 'confirmed'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      send_account_tags sat
    WHERE
      sat.send_account_id = sa.id
      AND sat.tag_id = t.id);

UPDATE
  send_accounts sa
SET
  main_tag_id =(
    SELECT
      t.id
    FROM
      tags t
    WHERE
      t.user_id = sa.user_id
      AND t.status = 'confirmed'
    ORDER BY
      t.created_at ASC
    LIMIT 1)
WHERE
  main_tag_id IS NULL;

-- Update send_account_tags foreign key to cascade
ALTER TABLE send_account_tags
  DROP CONSTRAINT IF EXISTS send_account_tags_tag_id_fkey;

ALTER TABLE send_account_tags
  ADD CONSTRAINT send_account_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

-- Drop existing foreign key first
ALTER TABLE send_accounts
    DROP CONSTRAINT IF EXISTS send_accounts_main_tag_id_fkey;

-- Add the foreign key with ON DELETE SET NULL
ALTER TABLE send_accounts
    ADD CONSTRAINT send_accounts_main_tag_id_fkey 
    FOREIGN KEY (main_tag_id) 
    REFERENCES tags(id) 
    ON DELETE SET NULL;

-- Update the validation trigger
CREATE OR REPLACE FUNCTION public.validate_main_tag_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
BEGIN
  -- Only prevent setting to NULL if there are other confirmed tags available
  IF NEW.main_tag_id IS NULL AND OLD.main_tag_id IS NOT NULL AND EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed') THEN
    RAISE EXCEPTION 'Cannot set main_tag_id to NULL while you have confirmed tags';
  END IF;
  -- Verify the new main_tag_id is one of the user's confirmed tags
  IF NEW.main_tag_id IS NOT NULL AND NOT EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed' AND t.id = NEW.main_tag_id) THEN
    RAISE EXCEPTION 'main_tag_id must be one of your confirmed tags';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_main_tag_update
  BEFORE UPDATE OF main_tag_id ON send_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_main_tag_update();

