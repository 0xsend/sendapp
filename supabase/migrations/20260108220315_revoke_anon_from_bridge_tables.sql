-- Revoke anon access from bridge tables
-- Anonymous users should not access these tables (RLS blocks anyway, but cleaner to revoke)

REVOKE ALL ON TABLE "public"."bridge_virtual_accounts" FROM "anon";
REVOKE ALL ON TABLE "public"."bridge_deposits" FROM "anon";
