# playwright

End-to-end testing for Send web applications.

## Specs

There are currently 3 kinds of specs:

- `*.anon.spec.ts` - anonymous specs, which do not require a user to be logged in.
- `*.logged-in.spec.ts` - authenticated specs, which require a user to be logged in, but not onboarded.
- `*.onboarded.spec.ts` - onboarded specs, which require a user to be logged in and onboarded.

These specs leverage fixtures to create the necessary users and data to run the tests using these personas.
