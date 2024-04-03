-- Extend the qualification end date for distribution #4
update public.distributions 
set qualification_end = (
  select '2024-04-15T00:00:00Z'::timestamp with time zone - interval '1 second'
) 
where "number" = 4;
