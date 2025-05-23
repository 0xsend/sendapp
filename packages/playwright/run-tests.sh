#!/bin/bash

# Set environment variables
export TEST_ENV=stagingNational
export NODE_OPTIONS="--no-warnings"

# Get the test file path from the arguments
TEST_PATH=$1

# Run the test with yarn
cd /Users/byoung/repos/send/sendapp3
yarn workspace @my/playwright test $TEST_PATH

# Exit with the same code as the test
exit $? 