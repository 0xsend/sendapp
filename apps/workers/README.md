# Temporal Workers

## Deploy

Environment variables:

- TEMPORAL_NAMESPACE: namespace for the Temporal Cloud
- TEMPORAL_TASK_QUEUE (hard-coded to `monorepo` for now)
- TEMPORAL_MTLS_TLS_CERT (file path to cert)
- NODE_ENV=production

# Structure

Notes on the structure demonstrated:

- **Workflows require one file**: you can organize Workflow code however you like, but each Worker needs to reference a single file that exports all the Workflows it handles (so you have to handle name conflicts instead of us)
- **Activities are top level**:
  - Inside the Temporal Worker, Activities are registered at the same level Workflows are.
  - Since Activities are required, not bundled, Activities don't need to be exported in a single file.
    Just make sure they are registered with some Workers if you intend them to be executed.
  - You can organize activities however you like, but it is important to understand that activities don't "belong" to workflows as far as Temporal is concerned.

We built this with `yarn` Workspaces. We expect this structure to work with most monorepo tooling: lerna, pnpm, nx, preconstruct, changesets, and Rush but haven't verified it - we cannot support your build tooling specifics but don't mind receiving feedback in our issues.

