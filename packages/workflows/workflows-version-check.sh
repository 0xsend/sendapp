#!/bin/bash

# Exit on any error
set -e

get_current_version() {
    node -p "require('./packages/workflows/package.json').version"
}

version_is_greater() {
    # Compare versions using sort -V (natural version sort)
    # Returns true if version1 is greater than version2
    [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" != "$1" ]
}

# Check if there are changes in ./packages/workflows/src
if ! git diff HEAD^ HEAD --quiet ./packages/workflows/src; then
    current_version=$(get_current_version)
    previous_version=$(git show HEAD^:./packages/workflows/package.json | node -p "JSON.parse(require('fs').readFileSync(0)).version")

    # Check if version has been bumped and is greater than previous version
    if ! version_is_greater "$current_version" "$previous_version"; then
        echo "ERROR: Changes detected in @my/workflows."
        echo "Please update the version in packages/workflows/package.json to be greater than $previous_version"
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