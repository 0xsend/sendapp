# builder has all the dependencies to build the app
FROM node:20-slim AS builder
WORKDIR /src
RUN corepack enable
ENV SHELL=/bin/bash
SHELL ["/bin/bash", "-c"]
RUN apt update && apt install -y curl git cargo build-essential
RUN curl -Lo- https://foundry.paradigm.xyz | /bin/bash
RUN source /root/.bashrc && foundryup
ENV PATH "$PATH:/root/.foundry/bin"
ENV DO_NOT_TRACK=1
ENV NEXT_TELEMETRY_DISABLED=1

# install yarn dependencies
WORKDIR /src
RUN --mount=type=cache,target=/root/.yarn/berry \
  --mount=type=cache,target=/tmp/yarn-cache \
  --mount=type=cache,target=/tmp/turbo-cache \
  --mount=type=bind,target=.,rw \
  --mount=type=secret,id=NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID \
  --mount=type=secret,id=NEXT_PUBLIC_SUPABASE_URL \
  --mount=type=secret,id=SUPABASE_SERVICE_ROLE \
  --mount=type=secret,id=NEXT_PUBLIC_SUPABASE_ANON_KEY \
  export NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="$(cat /run/secrets/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID)" \
  export NEXT_PUBLIC_SUPABASE_URL="$(cat /run/secrets/NEXT_PUBLIC_SUPABASE_URL)" \
  export SUPABASE_SERVICE_ROLE="$(cat /run/secrets/SUPABASE_SERVICE_ROLE)" \
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(cat /run/secrets/NEXT_PUBLIC_SUPABASE_ANON_KEY)" \
  export YARN_CACHE_FOLDER=/tmp/yarn-cache \
  export SKIP_YARN_POST_INSTALL=1 \
  && yarn install --immutable \
  && yarn turbo build --cache-dir=/tmp/turbo-cache --filter=next-app \
  && cp -r /src/apps/next/.next/standalone /sendapp/ \
  && cp -r /src/apps/next/.next/static /sendapp/apps/next/.next/static \
  && cp -r /src/apps/next/public /sendapp/apps/next/public

FROM node:20-slim AS runner
WORKDIR /sendapp

# Don't run production as root
RUN addgroup --system --gid 900 nodejs
RUN adduser --system --uid 900 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /sendapp .

CMD node apps/next/server.js
