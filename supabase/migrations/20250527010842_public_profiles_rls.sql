create policy "Public profiles are viewable by everyone."
on "public"."profiles"
as permissive
for select
to authenticated, anon
using ((is_public = true));
