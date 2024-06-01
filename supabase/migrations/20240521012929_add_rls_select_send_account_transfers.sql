create policy
"users can see their own transfers" -- noqa: RF05
on "public"."send_account_transfers" as permissive for
select
to public using (
    (
        (lower(concat('0x', encode(f, 'hex'::text))))::citext in (
            select send_accounts.address
            from
                send_accounts
            where
                (
                    send_accounts.user_id = (
                        select auth.uid()
                    )
                )
        )
        or (lower(concat('0x', encode(t, 'hex'::text))))::citext in (
            select send_accounts.address
            from
                send_accounts
            where
                (
                    send_accounts.user_id = (
                        select auth.uid()
                    )
                )
        )
    )
);
