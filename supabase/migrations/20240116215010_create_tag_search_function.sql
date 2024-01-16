create extension if not exists "pg_trgm" with schema "extensions";

alter table "public"."profiles"
add column "is_public" boolean default true;

create index tags_name_trigram_gist_idx on tags using gist (name gist_trgm_ops);

create or replace function public.tag_search(q text) returns TABLE(avatar_url TEXT, tag_name citext) language plpgsql immutable security definer as $function$ begin return query --
    select p.avatar_url::text as avatar_url, t.name as tag_name
from tags t
  join profiles p on t.user_id = p.id
where t.status = 'confirmed'::tag_status
  and p.is_public = true
order by t.name <->q;

end;

$function$;

revoke all on function public.tag_search(q text)
from anon;
