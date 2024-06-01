create policy
"users can see their own account created" -- noqa: RF05
on "public"."send_account_created" as permissive for
select
to public using (
    (
        (lower(concat('0x', encode(account, 'hex'::text))))::citext in (
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
