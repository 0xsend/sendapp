# TODO: Fix Workflows Jest Path Mapping & Transformation Issues

**Problem:**

The test suite for `packages/workflows` initially failed with "Cannot find module '@my/wagmi'" because the Jest configuration (`packages/workflows/jest.config.ts`) didn't correctly map the path aliases. Subsequent fixes revealed issues transforming ESM dependencies (`@my/wagmi`) that use JSON import attributes.

**Revised Plan:**

1.  **Update `ts-jest`:**
    *   Update `ts-jest` to the latest version in `packages/workflows/package.json` using `yarn workspace @my/workflows add -D ts-jest@latest`. This is necessary because the previously installed version (`^29.1.5`) predates PR #4517 and likely lacks full support for transforming JS dependencies with import attributes.

2.  **Modify `packages/workflows/tsconfig.json`:**
    *   Ensure `"allowJs": true` is set in `compilerOptions` to allow processing JavaScript dependencies.

3.  **Modify `packages/workflows/jest.config.ts` (Apply after `ts-jest` update):**
    *   Import `pathsToModuleNameMapper` from `ts-jest`.
    *   Import `compilerOptions` from `./tsconfig.json`.
    *   Use `pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })` to generate mappings based on the package's specific tsconfig paths.
    *   Merge these generated mappings with the existing `.js` mapping (`'^(\\.{1,2}/.*)\\.js$': '$1'`).
    *   Add a manual mapping for the `@my/contracts` alias used by the `@my/wagmi` dependency: `'^@my/contracts/(.*)$': '<rootDir>/../../packages/contracts/out/$1'`.
    *   Set `transformIgnorePatterns` to *not* ignore `@wagmi/core` and `wagmi`: `['/node_modules/(?!(@wagmi/core|wagmi|get-port)/)']`. This allows Jest (via `ts-jest`) to transform these dependencies.
    *   Configure the `transform` section to use `ts-jest` for `.ts` and `.js` files (`'^.+\\.(t|j)sx?$'`), ensuring `useESM: true` is set and `tsconfig` points to `./tsconfig.json`.
    *   *Do not* use Jest presets (`preset: ...`) as they can interfere with explicit transform configurations.

**Code Snippet for `packages/workflows/jest.config.ts` (Reflecting Plan):**

```typescript
/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest'; // Import the utility
// Import compilerOptions from this package's tsconfig
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  // No preset, rely on explicit transform config
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageProvider: 'babel',
  workerThreads: true,
  globalSetup: '<rootDir>/jest.setup.ts',
  // Allow transforming wagmi and its core dependency
  transformIgnorePatterns: ['/node_modules/(?!(@wagmi/core|wagmi|get-port)/)'],
  moduleNameMapper: {
    // Keep the existing ESM .js mapping
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // Generate mappings from this package's tsconfig.json paths
    // Prefix is relative to <rootDir> (packages/workflows)
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),

    // Add mapping for @my/contracts used by @my/wagmi, relative to *this* <rootDir>
    // Based on tsconfig.base.json: "@my/contracts/*": ["./packages/contracts/out/*", ...]
    '^@my/contracts/(.*)$': '<rootDir>/../../packages/contracts/out/$1',
  },
  transform: {
    // Use ts-jest for TS/JS files (Jest handles JSON natively)
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
};

export default config;
```

**Run Command:**

```bash
yarn workspace @my/workflows test | cat
```

**Debugging Notes / Further Investigation:**

*   **Initial Finding (Pre-Update):** Applying the configuration below with `ts-jest@^29.1.5` resulted in TypeScript errors (TS2307, TS2823) from `@my/wagmi/src/constants.ts`. This version predates PR #4517, suggesting potential lack of full support for transforming JS dependencies with import attributes (`import ... with { type: 'json' }`).
*   **Post-Update Strategy:** After updating `ts-jest` (Step 1), if errors persist:
    *   Consult the latest `ts-jest` documentation regarding ESM and import attributes.
    *   Investigate related issue `ts-jest`#4505 for specific insights.
    *   Consider alternative transformers (like Babel) specifically for `@my/wagmi` if `ts-jest` still struggles.
*   Attempts to mock the JSON file or `@my/wagmi` were previously unsuccessful but might be revisited if needed after the update.
*   Relevant `ts-jest` issue/PR (tests added post-`29.1.5`): [https://github.com/kulshekhar/ts-jest/pull/4517](https://github.com/kulshekhar/ts-jest/pull/4517) (Related issue: #4505)


## Conclusion

Even after trying these updates, it would fail in the `jest.setup.ts` file. I believe we have an incomplete or incorrect ESM configuration for `jest` and `ts-jest`.

```
/path/to/sendapp/packages/workflows/jest.setup.ts:4
export {};
^^^^^^

SyntaxError: Unexpected token 'export'
    at wrapSafe (node:internal/modules/cjs/loader:1378:20)
    at Module._compile (node:internal/modules/cjs/loader:1428:41)
    at Module._compile (/path/to/sendapp/node_modules/@jest/transform/node_modules/pirates/lib/index.js:117:24)
    at Module._extensions..js (node:internal/modules/cjs/loader:1548:10)
    at require.extensions.<computed> (/path/to/sendapp/node_modules/ts-node/src/index.ts:1608:43)
    at Object.newLoader [as .ts] (/path/to/sendapp/node_modules/@jest/transform/node_modules/pirates/lib/index.js:121:7)
    at Module.load (node:internal/modules/cjs/loader:1288:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1104:12)
    at Module.require (node:internal/modules/cjs/loader:1311:19)
    at require (node:internal/modules/helpers:179:18)
```
