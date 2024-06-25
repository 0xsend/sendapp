
# Mocks for app

This directory contains mocks for the app package. By matching the import path, Jest will automatically mock the module and return the mocked value.

For example, if you have a module named `app/utils/useProfileLookup` and you want to mock it, you can create a file named `__mocks__/app/utils/useProfileLookup.ts` and export a function that returns a mocked value.
