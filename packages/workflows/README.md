# workflows

- **Workflows require one file**: you can organize Workflow code however you like, but each Worker needs to reference a single file that exports all the Workflows it handles (so you have to handle name conflicts instead of us)
- **Activities are top level**:
  - Inside the Temporal Worker, Activities are registered at the same level Workflows are.
  - Since Activities are required, not bundled, Activities don't need to be exported in a single file.
    Just make sure they are registered with some Workers if you intend them to be executed.
  - You can organize activities however you like, but it is important to understand that activities don't "belong" to workflows as far as Temporal is concerned.
