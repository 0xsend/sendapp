FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/balance-reconciliation-worker/package.json ./apps/balance-reconciliation-worker/
COPY packages/supabase/package.json ./packages/supabase/

# Install dependencies
RUN yarn workspaces focus balance-reconciliation-worker --production

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/balance-reconciliation-worker/node_modules ./apps/balance-reconciliation-worker/node_modules

# Copy source files
COPY apps/balance-reconciliation-worker ./apps/balance-reconciliation-worker
COPY packages/supabase ./packages/supabase
COPY tsconfig.base.json ./

# Build
WORKDIR /app/apps/balance-reconciliation-worker
RUN yarn lint

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/balance-reconciliation-worker ./apps/balance-reconciliation-worker
COPY --from=builder /app/packages/supabase ./packages/supabase

WORKDIR /app/apps/balance-reconciliation-worker

# Run as non-root user
USER node

CMD ["yarn", "start"]
