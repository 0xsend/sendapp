Refactor the `useAddressBook` hook to use `useQueries` and combine the results.

Refactor the dependent queries to make it possible by extracting the query params into a queryOptions function.

- useSendEarnBalances
- useMyAffiliateVault
- useSendAccount

Follow the react query `useQueries` and `queryOptions` documentation below.

- `docs/react-query/reference/useQueries.md.`
- `docs/react-query/guides/query-options.md`

Relevant files:

- `packages/app/utils/useAddressBook.ts`
- `packages/app/features/earn/hooks/index.ts`
