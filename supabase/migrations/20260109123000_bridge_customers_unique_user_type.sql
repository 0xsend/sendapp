-- Allow one Bridge customer per user per profile type

ALTER TABLE public.bridge_customers
  DROP CONSTRAINT IF EXISTS bridge_customers_user_id_unique;

DROP INDEX IF EXISTS bridge_customers_user_id_unique;

ALTER TABLE public.bridge_customers
  ADD CONSTRAINT bridge_customers_user_id_type_unique UNIQUE (user_id, type);
