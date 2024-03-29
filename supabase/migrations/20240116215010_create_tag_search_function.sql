create extension if not exists "pg_trgm" with schema "extensions";

alter table "public"."profiles"
  add column "is_public" boolean default true;

create index tags_name_trigram_gin_idx on tags using gin(name gin_trgm_ops);

create or replace function public.tag_search(query text)
  returns table(
    avatar_url text,
    tag_name citext)
  language plpgsql
  immutable
  security definer
  as $function$
begin
  return query --
  select
    p.avatar_url::text as avatar_url,
    t.name as tag_name
  from
    profiles p
    join tags t on t.user_id = p.id
    join send_accounts sa on sa.user_id = p.id
  where
    t.status = 'confirmed'::tag_status
    and p.is_public = true
    and(t.name <<-> query < 0.9
      or t.name ilike '%' || query || '%')
  order by
    t.name <<-> query;
end;
$function$;

revoke all on function public.tag_search(q text) from anon;

