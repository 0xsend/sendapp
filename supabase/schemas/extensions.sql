-- Extensions and schema setup

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_tle";
GRANT CREATE ON SCHEMA "public" TO "postgres";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- Schemas
CREATE SCHEMA IF NOT EXISTS "private";
ALTER SCHEMA "private" OWNER TO "postgres";
CREATE SCHEMA IF NOT EXISTS "shovel";
ALTER SCHEMA "shovel" OWNER TO "postgres";
CREATE SCHEMA IF NOT EXISTS "temporal";
ALTER SCHEMA "temporal" OWNER TO "postgres";

-- Additional extensions
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";