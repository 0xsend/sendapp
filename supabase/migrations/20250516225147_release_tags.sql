-- remove trigger which checks if tag is in tags_reservations before insert/update
DROP TRIGGER IF EXISTS check_tags_allowlist_before_insert ON public.tags;

-- remove function that was used by removed trigger
DROP FUNCTION IF EXISTS public.check_tags_allowlist_before_insert_func();

-- remove table tag_reservations as it is not used
DROP TABLE IF EXISTS public.tag_reservations;
