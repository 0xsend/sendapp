# builder has all the dependencies to build the app
FROM node:20-slim AS base
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
ENV YARN_CACHE_FOLDER=/tmp/yarn-cache
COPY package.json yarn.lock ./
RUN corepack install

FROM base AS installer
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY .yarn .yarn
# git ls-files | grep 'package\.json$' | sort | sed 's#\(.*\)#COPY \1 \1#'     
COPY apps/distributor/package.json apps/distributor/package.json
COPY apps/expo/package.json apps/expo/package.json
COPY apps/next/package.json apps/next/package.json
COPY package.json package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/app/package.json packages/app/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/daimo-expo-passkeys/package.json packages/daimo-expo-passkeys/package.json
COPY packages/eslint-config-custom/package.json packages/eslint-config-custom/package.json
COPY packages/playwright/package.json packages/playwright/package.json
COPY packages/shovel/package.json packages/shovel/package.json
COPY packages/snaplet/package.json packages/snaplet/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/wagmi/package.json packages/wagmi/package.json
COPY packages/webauthn-authenticator/package.json packages/webauthn-authenticator/package.json
COPY supabase/package.json supabase/package.json

RUN --mount=type=cache,target=/root/.yarn/berry \
  --mount=type=cache,target=/tmp/yarn-cache \
  SKIP_YARN_POST_INSTALL=1 \
  NODE_ENV=development \
  yarn install --immutable

FROM base AS builder
WORKDIR /sendapp
COPY . .
COPY --from=installer /src/node_modules ./node_modules
ARG CI=
ARG DEBUG=
ARG NEXT_PUBLIC_SUPABASE_PROJECT_ID
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_GRAPHQL_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAINNET_RPC_URL
ARG NEXT_PUBLIC_BASE_RPC_URL
ARG NEXT_PUBLIC_BUNDLER_RPC_URL
ARG NEXT_PUBLIC_MAINNET_CHAIN_ID
ARG NEXT_PUBLIC_BASE_CHAIN_ID
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV CI=${CI}
ENV DEBUG=${DEBUG}
ENV NEXT_PUBLIC_SUPABASE_PROJECT_ID=${NEXT_PUBLIC_SUPABASE_PROJECT_ID}
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_GRAPHQL_URL=${NEXT_PUBLIC_SUPABASE_GRAPHQL_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_MAINNET_RPC_URL=${NEXT_PUBLIC_MAINNET_RPC_URL}
ENV NEXT_PUBLIC_BASE_RPC_URL=${NEXT_PUBLIC_BASE_RPC_URL}
ENV NEXT_PUBLIC_BUNDLER_RPC_URL=${NEXT_PUBLIC_BUNDLER_RPC_URL}
ENV NEXT_PUBLIC_MAINNET_CHAIN_ID=${NEXT_PUBLIC_MAINNET_CHAIN_ID}
ENV NEXT_PUBLIC_BASE_CHAIN_ID=${NEXT_PUBLIC_BASE_CHAIN_ID}
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
RUN --mount=type=cache,target=/tmp/yarn-cache \
  --mount=type=cache,target=/tmp/turbo-cache \
  --mount=type=secret,id=SUPABASE_DB_URL \
  --mount=type=secret,id=SUPABASE_SERVICE_ROLE \
  export SUPABASE_DB_URL="$(cat /run/secrets/SUPABASE_DB_URL)" \
  export SUPABASE_SERVICE_ROLE="$(cat /run/secrets/SUPABASE_SERVICE_ROLE)" \
  && yarn turbo build --cache-dir=/tmp/turbo-cache --filter=next-app

FROM node:20-slim AS runner
WORKDIR /sendapp
RUN addgroup --system --gid 900 nodejs
RUN adduser --system --uid 900 nextjs
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /sendapp/apps/next/.next/standalone /sendapp/
COPY --from=builder --chown=nextjs:nodejs /sendapp/apps/next/.next/static /sendapp/apps/next/.next/static
COPY --from=builder --chown=nextjs:nodejs /sendapp/apps/next/public /sendapp/apps/next/public
CMD node apps/next/server.js
