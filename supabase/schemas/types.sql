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
	"main_tag_id" bigint,
	"main_tag_name" "text",
	"tags" "text"[]
);
ALTER TYPE "public"."activity_feed_user" OWNER TO "postgres";

CREATE TYPE "public"."tag_status" AS ENUM (
    'pending',
    'confirmed',
    'available'
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