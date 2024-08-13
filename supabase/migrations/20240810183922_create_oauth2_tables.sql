-- adapted from: https://github.com/spring-projects/spring-authorization-server/blob/main/oauth2-authorization-server/src/main/resources/org/springframework/security/oauth2/server/authorization/client/oauth2-registered-client-schema.sql
CREATE TABLE "public"."oauth2_clients" (
    id SERIAL PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    client_id_issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    client_name TEXT NOT NULL UNIQUE,
    -- redirect_uri is stored in the table to prevent malicious URL redirect attacks
    redirect_uri TEXT NOT NULL,
    enabled boolean DEFAULT TRUE NOT NULL
);
ALTER TABLE "public"."oauth2_clients" ENABLE ROW LEVEL SECURITY;
CREATE INDEX "idx_oauth2_clients_client_id" ON "public"."oauth2_clients"(client_id);

-- table storing the scopes for clients
CREATE TABLE "public"."oauth2_client_scopes" (
    id SERIAL PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES "public"."oauth2_clients"(client_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    enabled boolean DEFAULT TRUE NOT NULL,
    UNIQUE (client_id, name)
);
ALTER TABLE "public"."oauth2_client_scopes" ENABLE ROW LEVEL SECURITY;
CREATE INDEX "idx_oauth2_scopes_client_id" ON "public"."oauth2_client_scopes"("client_id");

-- table storing the authorized grant types for clients
CREATE TABLE "public"."oauth2_client_authorization_grant_types" (
    id SERIAL PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES "public"."oauth2_clients"(client_id) ON DELETE CASCADE,
    grant_type TEXT NOT NULL,
    enabled boolean DEFAULT TRUE NOT NULL,
    UNIQUE (client_id, grant_type)
);
ALTER TABLE "public"."oauth2_client_authorization_grant_types" ENABLE ROW LEVEL SECURITY;
CREATE INDEX "idx_oauth2_authorization_grant_types_client_id" ON "public"."oauth2_client_authorization_grant_types"("client_id");

-- table storing the access tokens for clients
CREATE TABLE "public"."oauth2_client_access_tokens" (
    id SERIAL PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES "public"."oauth2_clients"(client_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    access_token_issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    access_token_expires_at TIMESTAMPTZ NOT NULL,
    enabled boolean DEFAULT TRUE NOT NULL
    scopes TEXT[] NOT NULL
);

-- table storing the refresh tokens for clients
CREATE TABLE "public"."oauth2_client_refresh_tokens" (
    id SERIAL PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES "public"."oauth2_clients"(client_id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    refresh_token_issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    enabled boolean DEFAULT TRUE NOT NULL
    scopes TEXT[] NOT NULL
);