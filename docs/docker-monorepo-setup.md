# Docker Setup for Send Monorepo

This document explains how to build and run Docker images for services in the Send monorepo using the unified Dockerfile approach.

## Overview

The Send monorepo uses a single Dockerfile at the root that can build any service in the monorepo:
- Next.js web app (`apps/next`) - target: `next-app-runner`
- Distributor service (`apps/distributor`) - target: `distributor-runner`
- Workers (`apps/workers`) - target: `workers-runner`

## Building Services

The Dockerfile uses build arguments and multi-stage builds to create optimized images for each service.

### Building the Next.js App

```bash
docker build \
  --target next-app-runner \
  --build-arg PACKAGE=next-app \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url> \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key> \
  # ... other Next.js build args ... \
  --tag sendapp-next:latest \
  .
```

### Building the Distributor Service

```bash
docker build \
  --target distributor-runner \
  --build-arg PACKAGE=distributor \
  --tag sendapp-distributor:latest \
  .
```

### Building the Workers Service

```bash
docker build \
  --target workers-runner \
  --build-arg PACKAGE=workers \
  --tag sendapp-workers:latest \
  .
```

### Building the Shovel Service

```bash
docker build \
  --target shovel-runner \
  --build-arg PACKAGE=@my/shovel \
  --tag sendapp-shovel:latest \
  .
```

## Running Services

### Next.js App

```bash
docker run -p 3000:3000 sendapp-next:latest
```

### Distributor Service

The distributor requires environment variables at runtime:

```bash
docker run -p 3001:3001 \
  -e SUPABASE_URL=<your-supabase-url> \
  -e SUPABASE_SERVICE_ROLE=<your-service-role> \
  -e RPC_URL_MAINNET=<mainnet-rpc> \
  -e RPC_URL_BASE=<base-rpc> \
  sendapp-distributor:latest
```

### Workers Service

```bash
docker run sendapp-workers:latest
```

## Docker Compose Example

For local development with all services:

```yaml
version: '3.8'

services:
  next:
    build:
      context: .
      target: next-app-runner
      args:
        PACKAGE: next-app
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        # Add other Next.js build args as needed
    ports:
      - "3000:3000"

  distributor:
    build:
      context: .
      target: distributor-runner
      args:
        PACKAGE: distributor
    ports:
      - "3001:3001"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE=${SUPABASE_SERVICE_ROLE}
      - RPC_URL_MAINNET=${RPC_URL_MAINNET}
      - RPC_URL_BASE=${RPC_URL_BASE}

  workers:
    build:
      context: .
      target: workers-runner
      args:
        PACKAGE: workers
    environment:
      - NODE_ENV=production
```

## Dockerfile Structure

The unified Dockerfile follows this structure:

1. **Foundry stage**: Provides blockchain tools (forge, cast, etc.)
2. **Base stage**: Common Node.js setup with Yarn
3. **Installer stage**: Installs all dependencies with caching
4. **Builder stage**: Builds the specified service with Turbo
5. **Service-specific runners**: Optimized runtime images for each service

### Key Features

- **Multi-stage builds**: Minimizes final image size
- **Build caching**: Uses Docker BuildKit cache mounts for faster builds
- **Shared dependencies**: All services share the same base layers
- **Security**: Runs services as non-root users
- **Service isolation**: Each service has its own optimized runner stage

## Environment Variables

### Next.js Build Arguments

The Next.js app requires these build arguments for static optimization:
- `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_GRAPHQL_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAINNET_RPC_URL`
- `NEXT_PUBLIC_BASE_RPC_URL`
- `NEXT_PUBLIC_BUNDLER_RPC_URL`
- `NEXT_PUBLIC_MAINNET_CHAIN_ID`
- `NEXT_PUBLIC_BASE_CHAIN_ID`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_CDP_APP_ID`
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_KYBER_SWAP_BASE_URL`
- `NEXT_PUBLIC_KYBER_CLIENT_ID`
- `NEXT_PUBLIC_GEOBLOCK`

### Distributor Runtime Variables

The distributor requires these environment variables at runtime:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE`: Service role key for admin access
- `RPC_URL_MAINNET`: Ethereum mainnet RPC endpoint
- `RPC_URL_BASE`: Base chain RPC endpoint
- `PORT`: Server port (default: 3001)

## CI/CD Integration

For GitHub Actions or other CI/CD systems:

```yaml
# Example GitHub Actions job
build:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      service: [next-app, distributor, workers]
  steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        target: ${{ matrix.service }}-runner
        build-args: |
          PACKAGE=${{ matrix.service }}
        tags: ghcr.io/${{ github.repository }}-${{ matrix.service }}:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

## Performance Optimization

### Build Caching

Enable BuildKit for better caching:

```bash
export DOCKER_BUILDKIT=1
```

### Layer Caching in CI

Use GitHub Actions cache or similar:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### Multi-platform Builds

For ARM64 support (M1/M2 Macs):

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target distributor-runner \
  --build-arg PACKAGE=distributor \
  --tag sendapp-distributor:latest \
  .
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all workspace dependencies are included in the COPY commands
   - Check that `tsconfig.base.json` is copied for TypeScript projects

2. **Bun runtime issues (distributor)**
   - The distributor runner installs Bun in the runtime image
   - Use `bun --bun run` to force Bun runtime

3. **Build failures**
   - Check that the PACKAGE build argument matches the turbo filter name
   - Verify all required build arguments are provided

### Debugging

```bash
# Run with shell access
docker run -it --entrypoint /bin/bash sendapp-distributor:latest

# Check build logs
docker build --progress=plain --no-cache .

# Inspect image layers
docker history sendapp-distributor:latest
```

## Security Best Practices

1. **Non-root users**: All services run as non-root users
2. **Minimal images**: Uses `node:20-slim` for runtime
3. **No secrets in images**: Use runtime environment variables for secrets
4. **Regular updates**: Keep base images updated for security patches

## Future Improvements

1. **Automated dependency updates**: Use Dependabot or Renovate
2. **Image scanning**: Integrate security scanning in CI/CD
3. **Size optimization**: Consider distroless images for even smaller size
4. **Build performance**: Implement distributed caching for team builds