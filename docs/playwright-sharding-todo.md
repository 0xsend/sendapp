# Playwright Sharding Todo 

This document outlines the tasks needed to complete the implementation of Playwright test sharding in our CI workflow.

## Issues to Fix

1. ✅ Docker build failure in CI - the build process needs all required environment variables

2. ✅ Missing artifacts in merge-reports job - needs to continue even if some artifacts are missing

## Action Plan

1. Update the Docker image build for CI:
   - [x] Move CI image to a separate repository: `ghcr.io/${{ github.repository }}/ci/next`
   - [x] Leverage `.env.local.template` for default environment variables
   - [x] Update Docker build step to use these environment variables

2. Implementation approach:
   - [x] Create script to load environment variables from `.env.local.template`
   - [x] Update Dockerfile to accept all environment variables from the template
   - [x] Generate build args dynamically from environment variables
   - [x] Tag image appropriately to indicate it's for CI use only

3. Workflow changes:
   - [x] Update the `build_next_image` job to read environment variables from `.env.local.template`
   - [x] Create a step to generate build args from all available environment variables
   - [x] Update the image reference in the Playwright test job
   - [x] Mark all environment variables as secrets for security

4. Testing:
   - [ ] Test the workflow changes locally if possible
   - [ ] Verify that the Docker build succeeds with the environment variables from the template
   - [ ] Confirm that Playwright tests can use the new Docker image

## Implementation Details

```yaml
# Example implementation for the environment variable script
- name: Set Environment Variables from Template
  run: |
    chmod +x ./scripts/github-actions-set-env-from-template.sh
    ./scripts/github-actions-set-env-from-template.sh .env.local.template

# Example implementation for generating build args dynamically
- name: Generate Build Args
  id: build-args
  run: |
    # Add all NEXT_PUBLIC_ variables from the environment
    for var in $(env | grep -o "^NEXT_PUBLIC_[^=]*"); do
      echo "$var=${{ env.$var }}" >> $GITHUB_OUTPUT
    done
```

## Benefits

1. More reliable Docker builds by using consistent environment variables
2. Clear separation of CI-specific Docker images
3. Better error handling for artifact collection in merge-reports job
4. Improved workflow reliability by using standardized environment variables
5. Enhanced security by marking all environment variables as secrets
6. More maintainable configuration with automatic inclusion of new environment variables