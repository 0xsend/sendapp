-- Bridge webhook events table: stores raw webhook events for idempotency and debugging
-- Service-role only access - no user-facing RLS policies

CREATE TABLE IF NOT EXISTS "public"."bridge_webhook_events" (
    "id" "uuid" PRIMARY KEY DEFAULT gen_random_uuid(),
    "bridge_event_id" "text" UNIQUE NOT NULL,
    "event_type" "text" NOT NULL,
    "event_created_at" timestamp with time zone,
    "payload" "jsonb" NOT NULL,
    "processed_at" timestamp with time zone,
    "error" "text",
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "public"."bridge_webhook_events" OWNER TO "postgres";

-- Indexes
CREATE INDEX IF NOT EXISTS "bridge_webhook_events_event_type_idx" ON "public"."bridge_webhook_events" ("event_type");
CREATE INDEX IF NOT EXISTS "bridge_webhook_events_created_at_idx" ON "public"."bridge_webhook_events" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "bridge_webhook_events_processed_at_idx" ON "public"."bridge_webhook_events" ("processed_at") WHERE "processed_at" IS NULL;

-- RLS (enabled but no policies - service-role only)
ALTER TABLE "public"."bridge_webhook_events" ENABLE ROW LEVEL SECURITY;

-- Grants (service_role only for webhook events)
GRANT ALL ON TABLE "public"."bridge_webhook_events" TO "service_role";
