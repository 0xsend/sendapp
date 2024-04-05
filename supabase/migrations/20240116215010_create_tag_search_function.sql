create extension if not exists "pg_trgm" with schema "extensions";

alter table "public"."profiles"
  add column "is_public" boolean default true;

create index tags_name_trigram_gin_idx on tags using gin(name gin_trgm_ops);

create or replace function public.tag_search(query text, limit_val integer = NULL, offset_val integer = NULL)
  returns table(
    send_id_matches jsonb,
    tag_matches jsonb,
    phone_matches jsonb)
  language plpgsql
  immutable
  security definer
  as $function$
begin
  return query --
  select
    COALESCE((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('avatar_url', avatar_url, 'tag_name', name, 'send_id', send_id))) from (select p.avatar_url, t.name, p.send_id from profiles p join tags t on t.user_id = p.id where query SIMILAR TO '\d+' and p.send_id::varchar ilike '%' || query || '%' order by p.send_id LIMIT limit_val OFFSET offset_val) sub), '[]') as send_id_matches,
    COALESCE((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('avatar_url', avatar_url, 'tag_name', name, 'send_id', send_id))) from (select p.avatar_url, t.name, p.send_id from profiles p join tags t on t.user_id = p.id where t.name ILIKE '%' || query || '%' order by (t.name <-> query) asc LIMIT limit_val OFFSET offset_val) sub), '[]') as tag_matches,
    COALESCE((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('avatar_url', avatar_url, 'phone', phone, 'tag_name', tag_name, 'send_id', send_id))) from (select p.avatar_url, u.phone, t.name as tag_name, p.send_id from profiles p join tags t on t.user_id = p.id join auth.users u on u.id = p.id where query ~ '^\d{6,}$' and u.phone like query || '%' order by u.phone LIMIT limit_val OFFSET offset_val) sub), '[]') as phone_matches;
end;
$function$;

revoke all on function public.tag_search(q text, limit_val int, offset_val int) from anon;