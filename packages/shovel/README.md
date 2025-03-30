# shovel

A simple CLI tool to generate shovel configs.

See the [shovel docs](https://indexsupply.com/shovel/docs/#getting-started) for more information.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run generate
```

## Adding new integrations

You can add new integrations by adding a new file to the `src/integrations` directory. Then, including it in the `src/index.ts` file and re-generating the config.json file.

When writing new integrations, you can have shovel create the base SQL for you by setting the `SHOVEL_MIGRATE` environment variable to `1`. Then, restart shovel and it will update the databse with the new SQL.

Then, you can leverage a migration tool like `supabase` to save the SQL as a migration. `yarn supabase db:diff shovel_my_new_integration`


This project was created using `bun init` in bun v1.0.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
