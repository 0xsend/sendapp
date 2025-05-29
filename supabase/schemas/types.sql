-- Custom types used across multiple tables

CREATE TYPE "public"."key_type_enum" AS ENUM (
    'ES256'
);
ALTER TYPE "public"."key_type_enum" OWNER TO "postgres";

CREATE TYPE "public"."lookup_type_enum" AS ENUM (
    'sendid',
    'tag',
    'refcode',
    'address',
    'phone'
);
ALTER TYPE "public"."lookup_type_enum" OWNER TO "postgres";

CREATE TYPE "public"."profile_lookup_result" AS (
	"id" "uuid",
	"avatar_url" "text",
	"name" "text",
	"about" "text",
	"refcode" "text",
	"x_username" "text",
	"birthday" "date",
	"tag" "public"."citext",
	"address" "public"."citext",
	"chain_id" integer,
	"is_public" boolean,
	"sendid" integer,
	"all_tags" "text"[]
);
ALTER TYPE "public"."profile_lookup_result" OWNER TO "postgres";

CREATE TYPE "public"."tag_search_result" AS (
	"avatar_url" "text",
	"tag_name" "text",
	"send_id" integer,
	"phone" "text"
);
ALTER TYPE "public"."tag_search_result" OWNER TO "postgres";

CREATE TYPE "public"."activity_feed_user" AS (
	"id" "uuid",
	"name" "text",
	"avatar_url" "text",
	"send_id" integer,
	"tags" "text"[]
);
ALTER TYPE "public"."activity_feed_user" OWNER TO "postgres";

CREATE TYPE "public"."tag_status" AS ENUM (
    'pending',
    'confirmed'
);
ALTER TYPE "public"."tag_status" OWNER TO "postgres";

CREATE TYPE "public"."temporal_status" AS ENUM (
    'initialized',
    'submitted',
    'sent',
    'confirmed',
    'failed'
);
ALTER TYPE "public"."temporal_status" OWNER TO "postgres";

CREATE TYPE "public"."verification_value_mode" AS ENUM (
    'individual',
    'aggregate'
);
ALTER TYPE "public"."verification_value_mode" OWNER TO "postgres";

CREATE TYPE "temporal"."transfer_status" AS ENUM (
    'initialized',
    'submitted',
    'sent',
    'confirmed',
    'failed',
    'cancelled'
);
ALTER TYPE "temporal"."transfer_status" OWNER TO "postgres";