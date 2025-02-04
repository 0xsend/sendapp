-- Historical data backup and tag release
CREATE TABLE IF NOT EXISTS historical_tag_associations(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tag_name citext NOT NULL,
    tag_id bigint NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    status tag_status NOT NULL,
    captured_at timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT historical_tag_associations_pkey PRIMARY KEY (id)
);

-- Backup current associations (only for existing users)
INSERT INTO historical_tag_associations(tag_name, tag_id, user_id, status)
SELECT
    t.name,
    t.id,
    t.user_id,
    t.status
FROM
    tags t
    JOIN auth.users u ON u.id = t.user_id
WHERE
    t.user_id IS NOT NULL;

-- Temporarily disable user-defined triggers
ALTER TABLE public.tags DISABLE TRIGGER check_tags_allowlist_before_insert;

ALTER TABLE public.tags DISABLE TRIGGER insert_verification_tag_registration;

ALTER TABLE public.tags DISABLE TRIGGER trigger_tags_after_insert_or_update;

ALTER TABLE public.tags DISABLE TRIGGER trigger_tags_before_insert_or_update;

-- Release unused tags by setting them to available status
UPDATE
    public.tags
SET
    status = 'available',
    user_id = NULL
WHERE
    user_id IN (
        SELECT
            t.user_id
        FROM
            tags t
        LEFT JOIN send_accounts sa ON t.user_id = sa.user_id
    WHERE
        sa.id IS NULL
        AND t.status = 'confirmed'
        AND t.user_id IS NOT NULL);

-- Re-enable user-defined triggers
ALTER TABLE public.tags ENABLE TRIGGER check_tags_allowlist_before_insert;

ALTER TABLE public.tags ENABLE TRIGGER insert_verification_tag_registration;

ALTER TABLE public.tags ENABLE TRIGGER trigger_tags_after_insert_or_update;

ALTER TABLE public.tags ENABLE TRIGGER trigger_tags_before_insert_or_update;

-- Drop and recreate indexes
DROP INDEX IF EXISTS idx_historical_tag_associations_user_id;

DROP INDEX IF EXISTS idx_historical_tag_associations_tag_id;

DROP INDEX IF EXISTS idx_historical_tag_associations_tag_name;

CREATE INDEX idx_historical_tag_associations_user_id ON historical_tag_associations(user_id);

CREATE INDEX idx_historical_tag_associations_tag_id ON historical_tag_associations(tag_id);

CREATE INDEX idx_historical_tag_associations_tag_name ON historical_tag_associations(tag_name);

-- Enable row level security on historical_tag_associations
ALTER TABLE historical_tag_associations ENABLE ROW LEVEL SECURITY;

-- only allow admins to view historical_tag_associations
CREATE POLICY "select_policy" ON historical_tag_associations
    FOR SELECT
        USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW tag_history AS
SELECT
    t.id AS tag_id,
    t.name,
    t.status,
    sat.created_at,
    p.send_id
FROM
    tags t
    JOIN send_account_tags sat ON sat.tag_id = t.id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    JOIN profiles p ON p.id = sa.user_id;

