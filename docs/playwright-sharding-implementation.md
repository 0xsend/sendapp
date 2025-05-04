# Playwright Sharding Implementation

This document describes the implementation details for playwright test sharding in our CI pipeline.

## Overview

To improve CI performance, we've implemented test sharding for our Playwright tests. This allows us to run tests in parallel across multiple CI jobs.

## Implementation Details

1. Split Playwright tests into 4 shards using the `--shard=n/4` parameter.
2. Each shard runs in a separate job with a unique ID.
3. Test results are uploaded as artifacts from each shard.
4. A final job merges all results into a single report.

## CI Workflow Changes

1. Added a matrix strategy to run 4 parallel test shards.
2. Added artifact upload/download for test results.
3. Added a merge-reports job to combine results from all shards.
4. Updated the Docker image build to use `.env.local.template` values for reliable builds.
5. Moved the CI Docker image to a separate repository: `ghcr.io/${{ github.repository }}/ci/next`

## Docker Image Build for CI

Docker image for Playwright tests is built using environment variables from `.env.local.template`:

1. The image is specifically built for CI purposes.
2. Default environment variables are loaded from `.env.local.template` using a custom script.
3. The script automatically marks all variables as secrets to prevent leaking sensitive information.
4. The Docker image is cached to speed up subsequent workflows.
5. The image is tagged appropriately to indicate it's for CI use.

## Environment Variables Handling

1. A dedicated script (`github-actions-set-env-from-template.sh`) loads environment variables from `.env.local.template`.
2. The script:
   - Filters out comments and empty lines
   - Properly handles variables with special characters 
   - Marks all values as secrets in GitHub Actions
   - Exports all variables to the GitHub Actions environment
3. The Docker build dynamically collects all environment variables from the GitHub Actions environment.
4. All `NEXT_PUBLIC_*` variables and other important backend variables are automatically passed to the Docker build.

## Test Artifact Handling

After tests complete:
1. Each shard uploads its test results as artifacts.
2. The merge-reports job downloads all shard artifacts.
3. Results are merged using Playwright's merge-reports command.
4. A consolidated report is generated and uploaded.
5. For PR builds, a summary is posted as a comment.

## Challenges and Solutions

1. **Docker Build Failures**: Fixed by using `.env.local.template` values to ensure all required environment variables are set.

2. **Missing Artifacts**: The merge-reports job now continues even if some artifacts are missing, preventing workflow failures when one or more shards fail.

3. **Environment Variables**: Standardized approach using `.env.local.template` to ensure consistent environment variables across local and CI environments.

## Future Improvements

1. Add caching for the Solidity compiler to make builds more resilient to network issues.
2. Consider further optimizing shard distribution for more balanced test execution times.
3. Improve error handling and reporting for clearer failure diagnosis.