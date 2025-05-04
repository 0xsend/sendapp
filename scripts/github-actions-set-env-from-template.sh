#!/usr/bin/env bash

# Exit on error
set -e

# Default template path
ENV_TEMPLATE_PATH=".env.local.template"

# If a template path is provided as an argument, use it instead
if [ "$1" != "" ]; then
  ENV_TEMPLATE_PATH="$1"
fi

echo "Reading environment variables from $ENV_TEMPLATE_PATH"

# Process the template file and export variables
# This filters out comments, empty lines, and properly handles special characters
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip empty lines and comments
  if [[ -z "$line" || "$line" =~ ^# ]]; then
    continue
  fi
  
  # Extract the variable name and value
  if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
    name="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    
    # Remove quotes if present
    value="${value#\"}"
    value="${value%\"}"
    value="${value#\'}"
    value="${value%\'}"
    
    # For GitHub Actions, add to GITHUB_ENV
    if [[ -n "$GITHUB_ENV" ]]; then
      # Add as a secret (mask in logs)
      echo "::add-mask::$value"
      echo "$name=$value" >> $GITHUB_ENV
      echo "Exported $name as a secret to GITHUB_ENV"
    else
      # For local testing, export to current shell
      export "$name=$value"
      echo "Exported $name to shell environment"
    fi
  fi
done < "$ENV_TEMPLATE_PATH"

echo "Environment variables setup complete"