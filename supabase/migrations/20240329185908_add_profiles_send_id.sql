-- Add send id to profiles based on when their account was created.
alter table public.profiles
  add column if not exists send_id int;

-- Update send_id in profiles from existing users
with subquery as (
            select
        id as user_id,
        row_number() over (
            order by
                created_at
        ) as send_id
    from
        auth.users
)
update public.profiles
  set send_id = subquery.send_id
  from subquery where profiles.id = subquery.user_id
  AND profiles.send_id IS NULL;

-- Create sequence for next send_ids to auto generate on insert into profiles.

CREATE SEQUENCE profiles_send_id_seq;
SELECT setval('profiles_send_id_seq', coalesce(max(send_id), 0) + 1, false) FROM profiles;
ALTER TABLE profiles ALTER COLUMN send_id SET DEFAULT nextval('profiles_send_id_seq');
create index concurrently on profiles(send_id);


CREATE OR REPLACE FUNCTION stop_change_send_id()
  RETURNS trigger AS
$BODY$
BEGIN
  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
$BODY$


CREATE TRIGGER avoid_send_id_change
  BEFORE UPDATE
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION stop_change_send_id();