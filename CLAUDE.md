# Send App

Next-generation payments app. Monorepo with cross-platform support (React Native + Next.js).

## Tech Stack

- **Monorepo:** Yarn workspaces + Turborepo
- **Cross-platform:** Tamagui (styles), Solito (routing)
- **Database/Auth:** Supabase (PostgreSQL + Auth)
- **Blockchain:** Foundry, Wagmi, Viem, Base chain
- **Testing:** Jest, pgTAP, Playwright
- **Linting:** Biome + ESLint + TypeScript
- **Dev:** Tilt orchestration

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `/apps/next` | Next.js web app |
| `/apps/expo` | React Native mobile app |
| `/apps/distributor` | SEND token distribution |
| `/packages/app` | Shared app logic/components |
| `/packages/ui` | Tamagui UI components |
| `/packages/contracts` | Foundry smart contracts |
| `/supabase` | Database schema, migrations, tests |

## Commands

```bash
# Development (recommended)
tilt up              # Start all services
tilt up next:web     # Just Next.js
tilt down            # Stop

# Without Tilt
yarn web             # Web dev
yarn native          # Native dev
```

## Linting

```bash
yarn biome:check     # Fast repo-wide check
yarn lint:fast       # Quick local iteration
yarn lint            # Full CI parity
yarn typecheck       # TypeScript only
```

## CRITICAL: Secrets (Public Repo)

- **NEVER hardcode secrets, tokens, API keys, passwords**
- K8s secrets MUST use ExternalSecrets → 1Password
- If secret missing from 1Password, STOP and ask user to add it
- Use `git add <specific-files>` not `git add -A`
- Environment vars: use `valueFrom.secretKeyRef`, never `value:`
