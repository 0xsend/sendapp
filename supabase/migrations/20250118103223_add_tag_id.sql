-- Drop foreign key constraints that reference tags(name)
ALTER TABLE tag_receipts
    DROP CONSTRAINT tag_receipts_tag_name_fkey;

ALTER TABLE referrals
    DROP CONSTRAINT referrals_tag_fkey;

ALTER TABLE tags
    ADD COLUMN id BIGINT;

ALTER TABLE tags
    ADD CONSTRAINT tags_name_unique UNIQUE (name);

-- Create sequence for id starting at 1
CREATE SEQUENCE tags_id_seq
    AS bigint START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

-- Update existing tags with IDs based on created_at order
WITH ordered_tags AS (
    SELECT
        name,
        row_number() OVER (ORDER BY created_at) AS rn
    FROM
        tags)
UPDATE
    tags t
SET
    id = ot.rn
FROM
    ordered_tags ot
WHERE
    t.name = ot.name;

-- Now we can drop the primary key on name
ALTER TABLE tags
    DROP CONSTRAINT tags_pkey;

-- Make id column not null and set it as primary key
ALTER TABLE tags
    ALTER COLUMN id SET NOT NULL,
    ADD PRIMARY KEY (id);

-- Set sequence to start after highest existing id
SELECT
    setval('tags_id_seq',(
            SELECT
                COALESCE(MAX(id), 0) + 1 FROM tags));

-- Make id column use the sequence by default
ALTER TABLE tags
    ALTER COLUMN id SET DEFAULT nextval('tags_id_seq');

-- Update existing tag references in tag_receipts
ALTER TABLE tag_receipts
    ADD COLUMN tag_id bigint REFERENCES tags(id) ON DELETE CASCADE;

UPDATE
    tag_receipts tr
SET
    tag_id = t.id
FROM
    tags t
WHERE
    tr.tag_name = t.name;

ALTER TABLE tag_receipts
    ALTER COLUMN tag_id SET NOT NULL;

-- Add tag_id to referrals
ALTER TABLE referrals
    ADD COLUMN tag_id bigint;

-- Update existing referrals with tag_id
UPDATE
    referrals r
SET
    tag_id = t.id
FROM
    tags t
WHERE
    t.name = r.tag;

-- Make tag_id not null
ALTER TABLE referrals
    ALTER COLUMN tag_id SET NOT NULL;

-- Add foreign key constraints with CASCADE
ALTER TABLE referrals
    ADD CONSTRAINT referrals_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

-- Make user_id nullable since tags can exist without an owner
ALTER TABLE tags
    ALTER COLUMN user_id DROP NOT NULL;

-- Add updated_at column
ALTER TABLE tags
    ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Add updated_at trigger function and trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

