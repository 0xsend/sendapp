# Makefile

# Check if .env.local exists, if not, create it from template
$(shell test -f .env.local || cp .env.local.template .env.local)
include .env.local

# Export variables from .env.local if not already set in the environment
define read_env
    $(eval export $(shell sed -ne 's/ *#.*$$//; /./ s/=.*$$//; s/^/export /; s/$$/?=$$\(shell grep -m1 "^&=" .env.local | cut -d= -f2-\)/' .env.local))
endef

$(call read_env)

IMAGE_NAME = sendapp/next-app
GIT_BRANCH = $(shell git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD)
GIT_HASH = $(shell git rev-parse --short=10 HEAD)
DOCKERFILE_PATH = ./apps/next/Dockerfile
BUILD_CONTEXT = .

# Docker build arguments
BUILD_ARGS = \
	--build-arg CI=${CI} \
	--build-arg DEBUG=${DEBUG} \
	--build-arg NEXT_PUBLIC_SUPABASE_PROJECT_ID=${NEXT_PUBLIC_SUPABASE_PROJECT_ID} \
	--build-arg NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL} \
	--build-arg NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
	--build-arg NEXT_PUBLIC_SUPABASE_GRAPHQL_URL=${NEXT_PUBLIC_SUPABASE_GRAPHQL_URL} \
	--build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
	--build-arg NEXT_PUBLIC_MAINNET_RPC_URL=${NEXT_PUBLIC_MAINNET_RPC_URL} \
	--build-arg NEXT_PUBLIC_BASE_RPC_URL=${NEXT_PUBLIC_BASE_RPC_URL} \
	--build-arg NEXT_PUBLIC_BUNDLER_RPC_URL=${NEXT_PUBLIC_BUNDLER_RPC_URL} \
	--build-arg NEXT_PUBLIC_MAINNET_CHAIN_ID=${NEXT_PUBLIC_MAINNET_CHAIN_ID} \
	--build-arg NEXT_PUBLIC_BASE_CHAIN_ID=${NEXT_PUBLIC_BASE_CHAIN_ID} \
	--build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID} \
	--build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}

# Docker secrets
SECRETS = \
	--secret id=SUPABASE_DB_URL \
	--secret id=SUPABASE_SERVICE_ROLE \
	--secret id=TURBO_TOKEN \
	--secret id=TURBO_TEAM

# Targets
.PHONY: docker-web docker-web-push
docker-web:
	@docker buildx build  --progress=plain --platform linux/amd64 -t $(IMAGE_NAME)-$(GIT_BRANCH):$(GIT_HASH) -t $(IMAGE_NAME)-$(GIT_BRANCH):latest $(BUILD_ARGS) $(SECRETS) -f $(DOCKERFILE_PATH) $(BUILD_CONTEXT) --progress=plain

docker-web-push: docker-web
	docker push $(IMAGE_NAME)-$(GIT_BRANCH):$(GIT_HASH)
	docker push $(IMAGE_NAME)-$(GIT_BRANCH):latest

# Prune docker system images and containers older than 7 days != otterscan
docker-clean:
	docker image prune -f --filter "label!=otterscan*" --filter until=168h