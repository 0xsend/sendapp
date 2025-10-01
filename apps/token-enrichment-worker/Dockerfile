FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/token-enrichment-worker/package.json ./apps/token-enrichment-worker/
COPY packages/supabase/package.json ./packages/supabase/
COPY packages/wagmi/package.json ./packages/wagmi/

# Install dependencies
RUN yarn workspaces focus token-enrichment-worker --production

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/token-enrichment-worker/node_modules ./apps/token-enrichment-worker/node_modules

# Copy source files
COPY apps/token-enrichment-worker ./apps/token-enrichment-worker
COPY packages/supabase ./packages/supabase
COPY packages/wagmi ./packages/wagmi
COPY tsconfig.base.json ./

# Build
WORKDIR /app/apps/token-enrichment-worker
RUN yarn lint

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/token-enrichment-worker ./apps/token-enrichment-worker
COPY --from=builder /app/packages/supabase ./packages/supabase
COPY --from=builder /app/packages/wagmi ./packages/wagmi

WORKDIR /app/apps/token-enrichment-worker

# Run as non-root user
USER node

CMD ["yarn", "start"]
