# Contribution Guide

Welcome to the Sendapp project! This guide provides instructions for setting up your development environment and contributing to the codebase.

## Preface

Sendapp uses a modern, cross-platform tech stack to deliver great developer experience, quick iteration cycles, and clean code. Key technologies include:

-   **TypeScript** (strict mode)
-   **Yarn 4** Package Manager (with Workspaces)
-   **Bun** (for script running)
-   **Turborepo** Build System
-   **Foundry** Toolkit (for smart contracts)
-   **React Native** with **Expo** (for mobile)
-   **Next.js** (for web)
-   **Tamagui** (for cross-platform UI)
-   **Solito** (for cross-platform routing)
-   **tRPC** (for type-safe APIs)
-   **Supabase** (PostgreSQL database, auth, etc.)
-   **Tilt** (for local development environment orchestration)

<details style="padding: 1rem 0">
<summary style="font-size:20px;font-weight: bold;"><h2 style="display:inline;padding:0 1rem;">Thinking in Send</h2></summary>

Here are some core philosophies to keep in mind when contributing:

<ul>
     <li>Simplicity over complexity (K.I.S.S)</li>
     <li>Don't repeat yourself (DRY)</li>
     <li>Write tests to ensure reliability and avoid manual repetition.</li>
     <li>Write once, run everywhere (prioritize cross-platform code).</li>
</ul>
</details>

## Prerequisites

Before you begin, ensure you have the following tools installed:

1.  **Git:** For version control.
2.  **Node.js:** Check the specific required version in the `.node-version` file at the project root and install it (using `nvm` is recommended).
3.  **Yarn:** We use Yarn 4. Enable it via Corepack:
    ```bash
    corepack enable
    ```
4.  **Bun:** Used for running scripts. Install via:
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```
5.  **Foundry:** Ethereum development toolkit. Install via `foundryup`:
    ```bash
    curl -L https://foundry.paradigm.xyz | bash
    # Then, in a new terminal session:
    foundryup
    ```
6.  **Docker:** For containerization, used by Tilt and Supabase. [Install Docker](https://docs.docker.com/get-docker/).
7.  **Other Dependencies (macOS):** If you are on macOS, install Homebrew if you haven't already, then run:
    ```bash
    brew bundle
    ```
    This installs tools like `caddy`, `jq`, etc., defined in the `Brewfile`.

## Getting Started

1.  **Clone the Repository:** Clone the project and initialize submodules:
    ```bash
    git clone --recurse-submodules https://github.com/0xsend/sendapp.git
    cd sendapp
    ```
    If you forgot `--recurse-submodules`, run this inside the `sendapp` directory:
    ```bash
    git submodule update --init --recursive
    ```

## Installation

1.  **Install Dependencies:** Install all project dependencies using Yarn:
    ```bash
    yarn install
    ```

<details style="padding: 0.5rem 0">
<summary style="font-size:16px;font-weight: bold;"><h4 style="display:inline;padding:0 0.5rem;">Troubleshooting: M1/M2/M3 Macs</h4></summary>

If you encounter errors installing `better-sqlite3` (e.g., `not an object file`), you might need to set environment variables for SQLite headers/libs installed via Homebrew. See [this issue](https://github.com/TryGhost/node-sqlite3/issues/1538) for details. Add the following to your shell configuration (`.zshrc`, `.bash_profile`, etc.) and also to your `.env.local` file (see next section):

```sh
# For shell environment
export LDFLAGS="-L/opt/homebrew/opt/sqlite/lib"
export CPPFLAGS="-I/opt/homebrew/opt/sqlite/include"
export PKG_CONFIG_PATH="/opt/homebrew/opt/sqlite/lib/pkgconfig"

# For .env.local (ensure these lines exist)
LDFLAGS=-L/opt/homebrew/opt/sqlite/lib
CPPFLAGS=-I/opt/homebrew/opt/sqlite/include
PKG_CONFIG_PATH=/opt/homebrew/opt/sqlite/lib/pkgconfig
```

</details>

## Environment Setup

1.  **Create Local Environment File:** Copy the template to create your local environment file:
    ```bash
    cp .env.local.template .env.local
    ```
2.  **Review Variables:** The `.env.local` file contains necessary environment variables for local development. The default values are generally sufficient when using the Tilt-based workflow, as they point to local services (Supabase, Anvil nodes) started by Tilt.
    -   You typically **do not** need to change most defaults for standard local development.
    -   Specific keys like `ANVIL_BASE_FORK_URL` might need adjustment. The default (`https://mainnet.base.org/`) might not be suitable for all local development, especially if you require a private or authenticated RPC endpoint for forking the Base mainnet within Tilt. Review the comments in `.env.local.template` and update values in your `.env.local` as needed for your specific tasks.

## Running the Development Environment (Tilt)

We strongly recommend using [Tilt](https://docs.tilt.dev/install.html) to manage the local development environment. It orchestrates all necessary services (Supabase, Anvil nodes, backend workers, frontend apps) and ensures consistency with CI.

1.  **Install Tilt:** Follow the [official Tilt installation guide](https://docs.tilt.dev/install.html).
2.  **Start the Environment:** From the project root, run:
    ```bash
    tilt up
    ```
    This command starts all services defined in the `Tiltfile`. You can monitor the status and logs via the Tilt UI, usually accessible at `http://localhost:10350`.
3.  **Running Specific Services:** To save resources, you can start only specific services and their dependencies. For example, to run only the Next.js web app:
    ```bash
    tilt up next:web
    ```
    You can find the names of other services in the Tilt UI or the `Tiltfile` / `tilt/*.Tiltfile` files.
4.  **Live Reloading:** Tilt automatically detects file changes and rebuilds/restarts the relevant services.
5.  **Shutting Down:**
    -   Press `Ctrl+C` in the terminal where `tilt up` is running to stop the foreground process.
    -   To ensure all background services (like Docker containers) are stopped and cleaned up, run:
        ```bash
        tilt down
        ```

## Development Workflow

1.  **Branching:**
    -   Create feature branches off the `dev` branch.
    -   Example: `git checkout dev && git pull && git checkout -b feat/my-new-feature`
    -   The `dev` branch is automatically deployed to the staging environment upon merging.
    -   The `main` branch reflects the production environment.
2.  **Committing:**
    -   Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for your commit messages. This helps automate changelogs and versioning.
    -   Example: `feat: add user profile page` or `fix: correct login button alignment`
3.  **Code Style & Linting:**
    -   We use Biome, Prettier, and ESLint for code formatting and linting.
    -   Check code style: `yarn lint`
    -   Apply automatic fixes: `yarn lint:fix`
    -   Ensure code is linted and formatted before committing. Refer to `GUIDELINES.md` for detailed style rules.
4.  **Testing:**
    -   Run tests to ensure your changes haven't introduced regressions. Tests are defined per-package/app.
    -   Check the `scripts` section in the relevant `package.json` (e.g., `packages/app/package.json`, `apps/next/package.json`) for specific test commands. Common patterns might include `yarn workspace <name> test`.
    -   Playwright tests for end-to-end testing can be run via `yarn playwright test` (often triggered manually or via Tilt).
5.  **Submitting Changes:**
    -   Push your feature branch to the remote repository.
    -   Create a Pull Request (PR) targeting the `dev` branch.
    -   Ensure all automated checks (linting, tests, builds) pass.
    -   Address any feedback from code reviews.
    -   Once approved and checks pass, the PR can be merged into `dev`.
6.  **Releases (Dev -> Main):**
    -   To release changes to production, create a PR from the `dev` branch to the `main` branch.
    -   This PR **must** be merged using a standard merge commit (not squash or rebase) to preserve the commit history from `dev`.

## Project Structure Overview

The project is a monorepo managed by Turborepo and Yarn Workspaces.

```
.
├── apps/             # Standalone applications (Next.js, Expo, etc.)
│   ├── expo/         # React Native mobile app
│   ├── next/         # Next.js web application
│   └── ...           # Other apps (workers, etc.)
├── packages/         # Shared libraries and components
│   ├── api/          # tRPC API definitions and server logic
│   ├── app/          # Core application logic, features, shared components (used by Next/Expo)
│   ├── contracts/    # Smart contracts (Solidity/Foundry)
│   ├── ui/           # Tamagui UI component library
│   ├── wagmi/        # Wagmi hooks generated from contracts
│   └── ...           # Other shared packages (utils, configs, etc.)
├── supabase/         # Supabase migrations, schema, tests
├── tilt/             # Tilt configuration files
├── ...               # Root configuration files (.eslintrc, tsconfig.json, etc.)
```

Refer to `GUIDELINES.md` for more in-depth architectural details and coding standards.

## Troubleshooting

-   **M1/M2/M3 Mac Build Issues:** If you encounter errors related to `better-sqlite3` during `yarn install`, refer to the "Installation" section for environment variable fixes.
-   **Tilt Issues:** Consult the Tilt UI logs (`http://localhost:10350`) for specific error messages from services. Ensure Docker Desktop is running.
-   **Supabase Issues:** Use `yarn supabase status` to check the local Supabase instance or `tilt logs supabase` for container logs. You might need to reset the database using the Tilt UI button ("supabase:db reset") or `yarn workspace @my/supabase reset`.
