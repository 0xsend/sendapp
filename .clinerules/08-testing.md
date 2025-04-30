# Testing

This document outlines the testing architecture and procedures for different parts of the project. Understanding how to run tests is crucial after making code changes.

## General Packages (`/packages/*`)

Most packages located under the `/packages` directory utilize **Jest** for testing.

**How to run tests:**

1.  Navigate to the specific package directory:
    ```bash
    cd packages/<package-name>
    ```
2.  Run the tests using Yarn:
    ```bash
    yarn test | cat
    ```
    *(Note: Piping to `cat` can help with formatting or handling specific terminal output behaviors.)*

## Supabase (`/supabase`)

The `/supabase` package uses **pgTAP** for database testing.

**How to run tests:**

```bash
yarn supabase test
```

**Important Considerations:**

*   If you have made changes to database migrations within `/supabase/migrations`, you **must** reset the test database before running tests to ensure the schema is up-to-date. Reset the database using the following command:
    ```bash
    cd supabase && yarn supabase reset
    ```
*   Ensure your local Supabase instance (or the designated test instance) is running.
    ```bash
    cd supabase && yarn supabase start
    ```

## Next.js App (`/apps/next`)

The Next.js application located at `/apps/next` uses **Playwright** for end-to-end testing. The Playwright tests themselves are located within the `/packages/playwright` directory.

**How to run tests:**

1.  Navigate to the Playwright package directory:
    ```bash
    cd packages/playwright
    ```
2.  Run the Playwright tests using Yarn:
    ```bash
    yarn playwright test
    ```
*   Ensure the Next.js application is running (usually via `yarn dev` in the `/apps/next` directory) before executing Playwright tests against it.

## Other Apps (`/apps/*`)

Applications located under `/apps` (excluding `/apps/next`) do not currently have standardized testing frameworks established. If you are working within these applications, consider discussing and implementing an appropriate testing strategy.
