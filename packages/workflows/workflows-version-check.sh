#!/bin/bash

# Exit on any error
set -e

get_current_version() {
    node -p "require('./packages/workflows/package.json').version"
}

# Check if there are changes in ./packages/workflows/src
if ! git diff HEAD^ HEAD --quiet ./packages/workflows/src; then
    current_version=$(get_current_version)

    # Check if version has been bumped
    if git show HEAD^:./packages/workflows/package.json | grep -q "\"version\": \"$current_version\""; then
        echo "ERROR: Changes detected in @my/workflows."
        echo "Please update the version in packages/workflows/package.json"
        echo ""
        echo "Recommended steps:"
        echo "1. Determine the appropriate version bump (patch/minor/major)"
        echo "2. Use one of these commands:"
        echo "   - npm version patch  # for bug fixes"
        echo "   - npm version minor  # for new features"
        echo "   - npm version major  # for breaking changes"
        echo ""
        exit 1
    fi
fi

exit 0