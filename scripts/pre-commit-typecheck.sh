#!/bin/bash
# Run typecheck only on packages with staged TypeScript files
# This provides fast feedback without checking the entire monorepo

set -e

# Get staged TypeScript files
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx)$' || true)

if [ -z "$STAGED_TS_FILES" ]; then
  echo "No TypeScript files staged, skipping typecheck"
  exit 0
fi

# Extract unique package paths from staged files
# Handles both packages/* and apps/* directories
PACKAGES=$(echo "$STAGED_TS_FILES" | sed -E 's#^(packages/[^/]+|apps/[^/]+)/.*#\1#' | sort -u)

if [ -z "$PACKAGES" ]; then
  echo "No package-scoped TypeScript files staged, skipping typecheck"
  exit 0
fi

# Build turbo filter arguments
FILTERS=""
for pkg in $PACKAGES; do
  if [ -f "$pkg/package.json" ]; then
    FILTERS="$FILTERS --filter=./$pkg"
  fi
done

if [ -z "$FILTERS" ]; then
  echo "No valid packages found, skipping typecheck"
  exit 0
fi

echo "Running typecheck for affected packages: $PACKAGES"
# Run lint which includes tsc --noEmit for type checking
exec npx turbo run lint $FILTERS --output-logs=errors-only
