---
name: sendapp-testing
description: Testing workflows for Send app. Use when running tests, debugging test failures, or setting up test infrastructure. Covers Jest (packages), pgTAP (Supabase), and Playwright (E2E).
---

# Testing in Send App

## Quick Reference

| Area | Framework | Command |
|------|-----------|---------|
| Packages (`/packages/*`) | Jest | `cd packages/<name> && yarn test` |
| Database (`/supabase`) | pgTAP | `cd supabase && yarn test` |
| E2E (`/apps/next`) | Playwright | `cd packages/playwright && yarn test` |

## Jest (Packages)

```bash
# Run all tests in a package
cd packages/<package-name> && yarn test

# Run single test file
cd packages/<package-name> && yarn test path/to/test.test.ts
```

## pgTAP (Supabase)

```bash
# Run database tests
cd supabase && yarn test
```

**Before running tests after schema changes:**
```bash
cd supabase && yarn reset
```

Requires local Supabase instance:
```bash
cd supabase && yarn start
```

## Playwright (E2E)

```bash
cd packages/playwright && yarn test
```

This loads environment variables via `_with-env` automatically.

**Prerequisites:**
- Next.js app must be running (`yarn dev` in `/apps/next`)
- Or use Tilt: `tilt up next:web`

## Other Apps

Apps under `/apps` (excluding `/apps/next`) don't have standardized testing. Discuss testing strategy when working in these areas.
