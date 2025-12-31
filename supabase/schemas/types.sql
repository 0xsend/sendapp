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

CREATE TYPE "public"."link_in_bio_domain_names" AS ENUM (
		'X',
		'Instagram',
		'YouTube',
		'TikTok',
		'GitHub',
		'Telegram',
		'Discord',
        'Facebook',
        'OnlyFans',
        'WhatsApp',
        'Snapchat',
        'Twitch'
);

ALTER TYPE "public"."link_in_bio_domain_names" OWNER TO "postgres";

CREATE TYPE "public"."tag_search_result" AS (
	"avatar_url" "text",
	"tag_name" "text",
	"send_id" integer,
	"phone" "text",
    "is_verified" boolean
);
ALTER TYPE "public"."tag_search_result" OWNER TO "postgres";

CREATE TYPE "public"."activity_feed_user" AS (
	"id" "uuid",
	"name" "text",
	"avatar_url" "text",
	"send_id" integer,
	"main_tag_id" bigint,
	"main_tag_name" "text",
	"tags" "text"[],
	"is_verified" boolean
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

-- Contact source enum for tracking how a contact was added
CREATE TYPE "public"."contact_source_enum" AS ENUM (
    'activity',
    'manual',
    'external',
    'referral'
);
ALTER TYPE "public"."contact_source_enum" OWNER TO "postgres";

-- Composite type for contact search results
-- Omits contact_user_id for privacy (prevents lookup of user IDs)
CREATE TYPE "public"."contact_search_result" AS (
    "contact_id" bigint,
    "owner_id" uuid,
    "custom_name" text,
    "notes" text,
    "is_favorite" boolean,
    "source" "public"."contact_source_enum",
    "last_interacted_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "external_address" text,
    "chain_id" text,
    "profile_name" text,
    "avatar_url" text,
    "send_id" integer,
    "main_tag_id" bigint,
    "main_tag_name" text,
    "tags" text[],
    "is_verified" boolean,
    "label_ids" bigint[]
);
ALTER TYPE "public"."contact_search_result" OWNER TO "postgres";
