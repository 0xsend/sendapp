create policy "Send revenues safe receives can be read by the user who created it"
on "public"."send_revenues_safe_receives"
as permissive
for select
to public
using (((lower(concat('0x', encode(sender, 'hex'::text))))::citext = ( SELECT chain_addresses.address
   FROM chain_addresses
  WHERE (chain_addresses.user_id = ( SELECT auth.uid() AS uid)))));
