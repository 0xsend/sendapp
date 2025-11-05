# Developer Guide

This guide provides essential information for developers and AI assistants working on the Send App codebase.

---

## SECURITY NOTICE

**THIS IS AN OPEN-SOURCE PROJECT**

All code, commits, and pull requests in this repository are publicly visible. Before committing or pushing any changes:

- **NEVER commit API keys, secrets, private keys, or credentials**
- **NEVER commit sensitive user data or personally identifiable information (PII)**
- **NEVER commit internal documentation, private URLs, or confidential information**
- **ALWAYS review your changes carefully before pushing**
- **ALWAYS use environment variables for configuration and secrets**
- **ALWAYS assume anything you commit will be public forever**

When in doubt, ask before committing. Git history is permanent, and even deleted commits can be recovered.

---

## Architecture Overview

Send is a next-generation payments app built as a monorepo with cross-platform support (React Native + Next.js). The architecture consists of:

### Tech Stack

- **Monorepo**: Yarn workspaces with Turborepo
- **Cross-platform**: Tamagui for shared styles, Solito for routing
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Blockchain**: Foundry, Wagmi, Viem, Base chain
- **Testing**: Jest (packages), pgTAP (Supabase), Playwright (E2E)
- **Linting**: Biome
- **Development**: Tilt for orchestration

### Key Directories

- `/apps/next`: Next.js web app
- `/apps/expo`: React Native mobile app
- `/apps/distributor`: SEND token distribution service
- `/packages/app`: Shared app logic and components
- `/packages/ui`: Tamagui-based UI components
- `/packages/contracts`: Smart contracts (Foundry)
- `/supabase`: Database schema, migrations, and tests

## Common Commands

### Development

```bash
# Start all services with Tilt (recommended)
tilt up

# Start specific services only
tilt up next:web  # Just the Next.js app

# Stop all services
tilt down

# Web development (without Tilt)
yarn web

# Native development
yarn native
```

### Testing

```bash
# Run all tests
yarn test

# Package-specific tests
cd packages/<package-name> && yarn test

# Supabase tests (requires local instance)
yarn supabase test

# E2E tests (requires running Next.js app)
cd packages/playwright && yarn playwright test

# Run a single test file
cd packages/<package-name> && yarn test path/to/test.test.ts
```

### Linting & Formatting

```bash
# Check code with Biome
npx @biomejs/biome check

# Fix issues automatically
npx @biomejs/biome check . --write

# Run linting via Turbo
yarn lint
yarn lint:fix
```

### Database

Send uses Supabase's **Declarative Schema** approach. Database schemas are defined in `supabase/schemas/` directory rather than writing migrations manually.

```bash
# Start local Supabase
cd supabase && yarn supabase start

# Reset database (required after migration changes)
cd supabase && yarn supabase reset

# Generate TypeScript types
cd supabase && yarn generate

# Making schema changes (declarative approach):
# 1. Stop the database
cd supabase && yarn supabase stop

# 2. Edit schema files in supabase/schemas/

# 3. Generate migration from schema changes
cd supabase && yarn migration:diff <migration_name>

# 4. Start database to apply changes
cd supabase && yarn supabase start
```

**Important**: Always stop the database before modifying schema files. The CI pipeline includes schema drift detection to ensure migrations stay in sync with declarative schemas.

### Smart Contracts

```bash
# Build contracts
yarn contracts build

# Run contract tests
yarn contracts test

# Deploy to local Anvil
yarn contracts forge script <script_name> --fork-url http://localhost:8546 --broadcast
```

## Development Process

The development process should be agile and iterative with tight feedback loops:

1. **Observe**: Understand the current code state and the desired outcome
2. **Orient**: Write code and tests to achieve the desired state
3. **Run**: Execute tests and verify functionality
4. **Reflect**: Evaluate if the desired state was achieved
5. **Repeat**: Iterate until complete

**Best Practices:**

- Keep changes small and focused
- Create task lists for complex features to track progress
- Seek clarification when blocked rather than making assumptions
- Maintain context awareness throughout development

## Code Style

Use a consistent style throughout the project, including code formatting, naming conventions, and documentation.

Follow the existing convention and style used in the project. Style can be localized to specific files or sections of code.

It is acceptable to vary styles to avoid making too many changes at once.

Assume the style is enforced by a linter and formatter.

### Platform-Specific Code

This project uses a platform-specific extension pattern to handle web vs. native differences:

1. **File naming convention**:

   - Base component: `ComponentName.tsx` - shared logic or web-specific implementation
   - Native override: `ComponentName.native.tsx` - React Native specific implementation

2. **When to create platform-specific files**:

   - When UI components need different native implementations
   - When using platform-specific APIs or components
   - When optimizing for different platform performance characteristics
   - When handling platform-specific UX patterns

3. **Example pattern** (TokenActivityFeed):
   - Web version uses RecyclerList (virtualized web list)
   - Native version uses FlatList (React Native's optimized list)
   - Components maintain the same API while using platform-optimized implementations

When developing new features, consider whether platform-specific implementations are needed and follow this established pattern.

### Comments

Comments should explain the code's functionality and design choices. Avoid including:

- Historical context about how the code evolved during development
- Debugging notes or conversational remarks
- Obvious descriptions of what the code does (the code should be self-documenting)

## Git Commit Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. When making commits, please use the following format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

Common types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect the meaning of the code (whitespace, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

### Examples

```
fix: update help.send.app URLs to support.send.app

Updated outdated help.send.app URLs to the new support.send.app domain with appropriate articles path.
```

```
feat(auth): add new passkey authentication flow

Added a new authentication flow using passkeys instead of traditional passwords.
```

**For AI-assisted commits**, include the Claude signature:

```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Documentation

Documentation is a critical component of software development. Store documentation files in the `/docs` folder with clear organization suitable for static site generation.

**Guidelines:**

- Update documentation when making significant changes
- Keep documentation synchronized with code changes
- Write clear, concise explanations of features and architecture
- Include code examples and usage patterns where helpful

## Testing

This section outlines the testing architecture and procedures for different parts of the project. Understanding how to run tests is crucial after making code changes.

### General Packages (`/packages/*`)

Most packages located under the `/packages` directory utilize **Jest** for testing.

**How to run tests:**

1. Navigate to the specific package directory:
   ```bash
   cd packages/<package-name>
   ```
2. Run the tests using Yarn:
   ```bash
   yarn test | cat
   ```
   _(Note: Piping to `cat` can help with formatting or handling specific terminal output behaviors.)_

### Supabase (`/supabase`)

The `/supabase` package uses **pgTAP** for database testing.

**How to run tests:**

```bash
yarn supabase test
```

**Important Considerations:**

- If you have made changes to:

  - Database schema files in `/supabase/schemas/`
  - Database migrations in `/supabase/migrations/`

  You **must** reset the test database before running tests to ensure the schema is up-to-date:

  ```bash
  cd supabase && yarn supabase reset
  ```

- When using declarative schemas, remember to:

  1. Stop the database before modifying schema files
  2. Generate migrations after schema changes
  3. Start the database to apply changes

- Ensure your local Supabase instance is running:
  ```bash
  cd supabase && yarn supabase start
  ```

### Next.js App (`/apps/next`)

The Next.js application located at `/apps/next` uses **Playwright** for end-to-end testing. The Playwright tests themselves are located within the `/packages/playwright` directory.

**How to run tests:**

1. Navigate to the Playwright package directory:
   ```bash
   cd packages/playwright
   ```
2. Run the Playwright tests using Yarn:
   ```bash
   yarn playwright test
   ```

- Ensure the Next.js application is running (usually via `yarn dev` in the `/apps/next` directory) before executing Playwright tests against it.

### Other Apps (`/apps/*`)

Applications located under `/apps` (excluding `/apps/next`) do not currently have standardized testing frameworks established. If you are working within these applications, consider discussing and implementing an appropriate testing strategy.

## Useful Commands

### Linting and Testing

This project uses Biome for linting and formatting. Run lint checks with:

```bash
npx @biomejs/biome check
```
