create policy "users can see their own account created" on "public"."send_account_created" as permissive for
select
  to public using (
    (
      (lower(concat('0x', encode(account, 'hex'::text))))::citext IN (
        SELECT
          send_accounts.address
        FROM
          send_accounts
        WHERE
          (
            send_accounts.user_id = (
              SELECT
                auth.uid () AS uid
            )
          )
      )
    )
  );
