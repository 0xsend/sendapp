drop policy "Send revenues safe receives can be read by the user who created" on "public"."send_revenues_safe_receives";

create policy "Send revenues safe receives can be read by the user who created"
on "public"."send_revenues_safe_receives"
as permissive
for select
to public
using (((lower(concat('0x', encode(sender, 'hex'::text))))::citext IN ( SELECT chain_addresses.address
   FROM chain_addresses
  WHERE (chain_addresses.user_id = ( SELECT auth.uid() AS uid))
UNION
 SELECT send_accounts.address
   FROM send_accounts
  WHERE (send_accounts.user_id = ( SELECT auth.uid() AS uid)))));



