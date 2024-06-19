FROM node:20-slim AS base

# Set working directory

FROM base AS builder
WORKDIR /app
ENV SHELL=/bin/bash
SHELL ["/bin/bash", "-c"]
RUN apt update && apt install -y curl git cargo build-essential
RUN curl -Lo- https://foundry.paradigm.xyz | /bin/bash
RUN source /root/.bashrc && foundryup
ENV PATH "$PATH:/root/.foundry/bin"
RUN corepack enable
RUN yarn global add turbo
COPY . .
RUN turbo prune next-app --docker

# Add lockfile and package.json's of isolated subworkspace

FROM builder AS installer
WORKDIR /app
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/tsconfig* ./
RUN yarn install



# Build the project
COPY --from=builder /app/out/full/ .

RUN --mount=type=secret,id=NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID \
  --mount=type=secret,id=NEXT_PUBLIC_SUPABASE_URL \
  --mount=type=secret,id=SUPABASE_SERVICE_ROLE \
  --mount=type=secret,id=NEXT_PUBLIC_SUPABASE_ANON_KEY \
  export NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$(cat /run/secrets/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) \
  export NEXT_PUBLIC_SUPABASE_URL=$(cat /run/secrets/NEXT_PUBLIC_SUPABASE_URL) \
  export SUPABASE_SERVICE_ROLE="$(cat /run/secrets/SUPABASE_SERVICE_ROLE)" \
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(cat /run/secrets/NEXT_PUBLIC_SUPABASE_ANON_KEY)" \
  && yarn turbo run build --filter=next-app 

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 900 nodejs
RUN adduser --system --uid 900 nextjs
USER nextjs

COPY --from=installer /app/apps/next/next.config.js .
COPY --from=installer /app/apps/next/package.json .

# Automatically leverage output traces to reduce image size
# https://next-appjs.org/docs/advanced-features/output-file-tracing

COPY --from=installer --chown=nextjs:nodejs /app/apps/next/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/next/.next/static ./apps/next/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/next/public ./apps/next/public

CMD node apps/next/server.js

