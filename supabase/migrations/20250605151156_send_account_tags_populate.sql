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

-- Set main tag for existing users
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
