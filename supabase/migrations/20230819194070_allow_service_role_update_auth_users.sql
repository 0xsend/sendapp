-- ensure users have update access to auth.users on confirmation_sent_at and confirmation_token
grant all on table auth.users to service_role;
