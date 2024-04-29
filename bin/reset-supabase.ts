#!/usr/bin/env bun run
import 'zx/globals'

/**
 * Deletes all docker containers and volumes matching the name "supabase".
 * This is useful for resetting the local development environment.
 */

$.verbose = true

await $`bunx supabase stop --no-backup`

const containers = (await $`docker ps -a --format '{{.Names}}'`).stdout
  .split('\n')
  .filter((c) => c.match(/supabase/i))

const volumes = (await $`docker volume ls --format '{{.Name}}'`).stdout
  .split('\n')
  .filter((c) => c.match(/supabase/i))

console.log(`Deleting supabase containers and volumes:\n${[...containers, ...volumes].join('\n')}`)

if (containers.length > 0) {
  await $`docker kill -s SIGKILL ${containers}`
  await $`docker rm ${containers}`
}

if (volumes.length > 0) {
  await $`docker volume rm ${volumes}`
}

console.log(chalk.green('Done!'))
